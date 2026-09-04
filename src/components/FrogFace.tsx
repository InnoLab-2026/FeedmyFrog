/*
 * The feedmyfrog frog, in two moods.
 *
 * Same geometry as `src/app/icon.svg`, which is the browser-tab icon — if you
 * restyle one, restyle the other. It is drawn here as markup rather than
 * loaded from that file because the two moods have to swap mid-hop: an <img>
 * whose src changes costs a fetch and a decode the first time round and can
 * flash empty between frames, whereas inline shapes swap in the same render as
 * the hop itself, with nothing to load.
 *
 * The resting face is the unimpressed one from the tab: half-lidded eyes over
 * a frown. `happy` opens both. Opening only the mouth reads as the same
 * grumpy frog yawning -- it is the slant across the eyes that carries the
 * mood, so the lids have to come off with it.
 */
export default function FrogFace({
  happy = false,
  size = 56,
}: {
  happy?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <circle cx="32" cy="32" r="32" fill="#8DC63F" />

      {/* Body, then the two eye bumps sitting on top of it. */}
      <ellipse cx="32" cy="42" rx="21.5" ry="15.5" fill="#4E4E4E" />
      <circle cx="20" cy="26" r="9.5" fill="#4E4E4E" />
      <circle cx="44" cy="26" r="9.5" fill="#4E4E4E" />

      {happy ? (
        <>
          {/* Wide open: the same circles the lids were cut out of. */}
          <circle cx="19.5" cy="26.5" r="6" fill="#FFFFFF" />
          <circle cx="44.5" cy="26.5" r="6" fill="#FFFFFF" />
        </>
      ) : (
        <>
          <path
            d="M13.5 26.5a6 6 0 0 0 12 0 6 6 0 0 0-1.2-3.6l-9.8 1.9a6 6 0 0 0-1 1.7Z"
            fill="#FFFFFF"
          />
          <path
            d="M38.5 26.5a6 6 0 0 0 12 0 6 6 0 0 0-1-1.7l-9.8-1.9a6 6 0 0 0-1.2 3.6Z"
            fill="#FFFFFF"
          />
        </>
      )}

      <circle cx="21" cy="27" r="3.1" fill="#1E1E1E" />
      <circle cx="43" cy="27" r="3.1" fill="#1E1E1E" />

      {happy ? (
        /* Open smile: flat along the top, bulging below. A plain oval here
           reads as startled rather than pleased. */
        <path d="M23 44h18a9 9 0 0 1-18 0Z" fill="#1E1E1E" />
      ) : (
        /* Frown: corners low, middle high. */
        <path
          d="M23 45.5q9-6 18 0"
          fill="none"
          stroke="#1E1E1E"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
