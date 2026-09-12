#!/usr/bin/env python3
"""
Turn public/feedmyfrog.jpg into public/feedmyfrog.png with the background
keyed out.

Why this exists: the mail's logo has to sit on whatever colour is behind it,
and JPEG has no alpha channel, so the source file carries its white background
baked in and renders as a white rectangle in every client. This produces the
same artwork with the background removed.

Two passes, because the artwork and the lettering need opposite treatment.

Over the frog, white is removed by a flood fill inwards from the border rather
than by a global "is this pixel white" test: the frog's eyes are white, and a
global test would punch them out and leave it staring through two holes at
whatever is behind the mail. Only white reachable from the outside is
background there.

Under the frog, the wordmark and tagline need the opposite. The enclosed
counters of the letters -- the middles of the e, d, o and g, and the inside of
the (c) -- are white and are *not* reachable from the outside, so the flood
fill leaves them as white blobs sitting inside the letterforms. Below the
lettering starts, every near-white pixel goes, enclosed or not.

The boundary between the two passes is not a magic number: it is the band of
completely empty rows that separates the lily pad from the wordmark, found by
looking rather than by measuring once and writing it down.

The mask is deliberately hard-edged at full resolution and softened by the
downscale: resampling a 1:1 mask down to the size the mail actually renders is
what produces a clean anti-aliased edge, and it does a better job than any
threshold feathering applied by hand.

Run from the repository root:

    python3 scripts/make_logo_png.py
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path("public/feedmyfrog.jpg")
OUT = Path("public/feedmyfrog.png")

# A pixel counts as background only if every channel is at least this bright.
# The source corners are #FEFEFE rather than pure white, and JPEG ringing puts
# the surrounding pixels a shade or two below that, so the cut is not at 255.
WHITE = 238

# Twice the 140 CSS px the mail asks for, so it still resolves on a 2x
# display. Larger than that is bytes nobody sees, and this one is fetched
# again every time somebody opens the mail.
TARGET_WIDTH = 280


def background_mask(image: Image.Image) -> bytearray:
    """1 for every pixel reachable from the border through near-white pixels."""
    width, height = image.size
    pixels = image.load()
    mask = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if not (0 <= x < width and 0 <= y < height):
            return
        if mask[y * width + x]:
            return
        r, g, b = pixels[x, y][:3]
        if r < WHITE or g < WHITE or b < WHITE:
            return
        mask[y * width + x] = 1
        queue.append((x, y))

    for x in range(width):
        consider(x, 0)
        consider(x, height - 1)
    for y in range(height):
        consider(0, y)
        consider(width - 1, y)

    while queue:
        x, y = queue.popleft()
        consider(x + 1, y)
        consider(x - 1, y)
        consider(x, y + 1)
        consider(x, y - 1)

    return mask


def lettering_top(image: Image.Image, mask: bytearray) -> int:
    """
    The first row of the lettering under the artwork.

    Found as the far side of the first run of entirely-background rows that
    comes after the artwork has begun — the gap between the lily pad and the
    wordmark. Returning the image height (no gap found) leaves the second pass
    with nothing to do, which is the safe direction to fail: the artwork keeps
    its whites rather than losing the frog's eyes.
    """
    width, height = image.size

    def is_empty(y: int) -> bool:
        row = y * width
        return all(mask[row + x] for x in range(width))

    seen_content = False

    for y in range(height):
        if not is_empty(y):
            seen_content = True
            continue

        if not seen_content:
            continue  # still in the top margin

        end = y
        while end < height and is_empty(end):
            end += 1

        return end if end < height else height

    return height


def snap_palette_alpha(image: Image.Image, tolerance: int = 6) -> Image.Image:
    """
    Rounds nearly-opaque and nearly-clear palette entries to exactly 255 and 0.

    Quantising treats alpha as one more dimension to cluster on, so the solid
    interior of the artwork comes back at 254 rather than 255 — invisible on
    its own, but it means the whole logo is faintly translucent and picks up a
    tint from whatever is behind it. The anti-aliased rim, which is the reason
    for having alpha at all, is left exactly as it is.
    """
    palette = image.palette
    if palette is None or palette.mode != "RGBA":
        raise ValueError(f"expected an RGBA palette, got {palette and palette.mode}")

    # Quadruples of r, g, b, a; only the alpha byte of each is touched.
    entries = bytearray(palette.palette)

    for index in range(3, len(entries), 4):
        value = entries[index]
        if value >= 255 - tolerance:
            entries[index] = 255
        elif value <= tolerance:
            entries[index] = 0

    palette.palette = bytes(entries)
    palette.dirty = 1
    return image


def main() -> int:
    if not SRC.exists():
        print(f"{SRC} not found — run this from the repository root", file=sys.stderr)
        return 1

    source = Image.open(SRC).convert("RGB")
    width, height = source.size

    mask = background_mask(source)
    print(f"pass 1 (flood fill): {sum(mask) / (width * height):.1%} of pixels cleared")

    band_top = lettering_top(source, mask)
    pixels = source.load()
    enclosed = 0

    for y in range(band_top, height):
        row = y * width
        for x in range(width):
            if mask[row + x]:
                continue
            r, g, b = pixels[x, y][:3]
            if r >= WHITE and g >= WHITE and b >= WHITE:
                mask[row + x] = 1
                enclosed += 1

    print(f"pass 2 (rows {band_top}+): {enclosed:,} enclosed white pixels cleared")
    print(f"total: {sum(mask) / (width * height):.1%} of pixels transparent")

    alpha = Image.frombytes(
        "L", (width, height), bytes(0 if m else 255 for m in mask)
    )
    keyed = source.convert("RGBA")
    keyed.putalpha(alpha)

    # Drop the dead margin so the artwork fills the box the mail gives it.
    box = keyed.getbbox()
    keyed = keyed.crop(box)
    print(f"trimmed to {keyed.width}x{keyed.height}")

    scaled_height = round(keyed.height * TARGET_WIDTH / keyed.width)
    keyed = keyed.resize((TARGET_WIDTH, scaled_height), Image.LANCZOS)

    # Quantised to a palette, which for flat-colour line art is visually
    # indistinguishable and roughly a fifth of the bytes of straight RGBA
    # (15 KB against 69 KB at this size). The transparency then lives in a
    # tRNS table rather than a per-pixel alpha channel; that is a table some
    # tools drop on re-export, so src/lib/email.test.ts asserts the corners
    # are still clear and the edge is still soft.
    keyed = keyed.quantize(colors=255, method=Image.FASTOCTREE)
    keyed = snap_palette_alpha(keyed)
    keyed.save(OUT, "PNG", optimize=True)

    print(f"wrote {OUT}: {keyed.width}x{scaled_height}, {OUT.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
