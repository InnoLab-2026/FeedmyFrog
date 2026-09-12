import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('@/lib/env', () => ({
  env: {
    BREVO_API_KEY: 'xkeysib-test',
    MAGIC_LINK_TTL_MINUTES: 15,
    NEXT_PUBLIC_BASE_URL: 'https://feedmyfrog.click',
  },
}));

const { sendMagicLink } = await import('./email');
const { emailResources } = await import('@/i18n/emailResources');

const URL_TOKEN = 'https://feedmyfrog.click/verify-prompt?token=abc123';

describe('sendMagicLink', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  function payload() {
    const [, init] = fetchMock.mock.calls[0];
    return JSON.parse(init.body);
  }

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends to the Brevo transactional endpoint with the api key header', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers['api-key']).toBe('xkeysib-test');
    expect(payload().to).toEqual([{ email: 'anna@reutlingen-university.de' }]);
  });

  it('sends from the verified, DKIM-signed domain under the product name', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    expect(payload().sender).toEqual({
      name: 'Reutlingen University Connect',
      email: 'noreply@feedmyfrog.click',
    });
  });

  it.each(['en', 'de', 'fr', 'tr', 'es'] as const)(
    'uses the %s subject and declares the language',
    async (lang) => {
      await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, lang);

      const body = payload();
      expect(body.subject).toBe(emailResources[lang].magicLink.subject);
      expect(body.headers['Content-Language']).toBe(lang);
      expect(body.htmlContent).toContain(`<html lang="${lang}"`);
    },
  );

  it.each(['en', 'de', 'fr', 'tr', 'es'] as const)(
    'puts the link and the TTL into both parts for %s',
    async (lang) => {
      await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, lang);

      const body = payload();
      // A client that prefers text must get a usable message, not an empty
      // part with the real content hidden in the HTML.
      expect(body.textContent).toContain(URL_TOKEN);
      expect(body.textContent).toContain('15');
      expect(body.htmlContent).toContain(URL_TOKEN);
      expect(body.htmlContent).toContain('15');
    },
  );

  it('leaves no unfilled placeholder in either part', async () => {
    for (const lang of ['en', 'de', 'fr', 'tr', 'es'] as const) {
      fetchMock.mockClear();
      await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, lang);

      const body = payload();
      expect(body.subject).not.toMatch(/\{\{/);
      expect(body.textContent).not.toMatch(/\{\{/);
      expect(body.htmlContent).not.toMatch(/\{\{/);
    }
  });

  it('repeats the link as text so a stripped button does not strand the reader', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    const html = payload().htmlContent;
    // Once in the button, once in the visible fallback line.
    expect(html.split(URL_TOKEN).length - 1).toBeGreaterThanOrEqual(2);
  });

  it('escapes the link rather than pasting it into the markup raw', async () => {
    const hostile = 'https://feedmyfrog.click/verify-prompt?token=a"><script>x</script>';
    await sendMagicLink('anna@reutlingen-university.de', hostile, 'en');

    const html = payload().htmlContent;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot;');
  });

  it('resolves the logo against the configured base URL, not a literal host', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    const html = payload().htmlContent;
    // A mail client has no page to resolve a relative src against, and a
    // hardcoded host makes a preview deployment quietly serve production's.
    expect(html).toContain('src="https://feedmyfrog.click/feedmyfrog.png"');
    expect(html).not.toMatch(/src="\/[^/]/);
  });

  it('points at a format that can carry a transparent background', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    /*
     * JPEG has no alpha channel. The site's feedmyfrog.jpg has the white
     * background baked into it, and every client rendered it as a white
     * rectangle sitting on whatever was behind it. Switching this back to
     * the .jpg brings the box back.
     */
    const html = payload().htmlContent;
    expect(html).not.toContain('.jpg');
    expect(html).not.toContain('.jpeg');
  });

  it('ships a logo that really is transparent, not just named .png', () => {
    /*
     * Read out of the file's own chunks rather than through an image library.
     * The only decoder in the dependency tree is sharp, which is here as a
     * transitive dependency of next rather than one this project asked for,
     * and a test is a poor place to start relying on that. A PNG's header and
     * its transparency table are both plain bytes at known offsets.
     */
    const png = readFileSync('public/feedmyfrog.png');
    const chunks = new Map<string, Buffer>();

    for (let offset = 8; offset + 8 <= png.length; ) {
      const length = png.readUInt32BE(offset);
      const type = png.toString('ascii', offset + 4, offset + 8);
      chunks.set(type, png.subarray(offset + 8, offset + 8 + length));
      if (type === 'IEND') break;
      offset += 12 + length;
    }

    const ihdr = chunks.get('IHDR');
    expect(ihdr).toBeDefined();

    /*
     * Colour type 3 is indexed, and an indexed PNG carries its alpha in a
     * tRNS table. 0 and 2 are greyscale and truecolour with no alpha at all —
     * which is what a re-export through a tool that flattens the background
     * would leave behind, and it would still be called .png.
     */
    const colourType = ihdr![9];
    expect([3, 4, 6]).toContain(colourType);

    const trns = chunks.get('tRNS');
    expect(trns).toBeDefined();

    const alphas = [...trns!];
    // At least one fully clear entry: the background actually went away.
    expect(alphas).toContain(0);
    // And a spread of partial values: a soft edge, not a stair-stepped cutout.
    expect(alphas.filter((a) => a > 0 && a < 255).length).toBeGreaterThan(20);
  });

  it('declares a colour scheme so a dark-mode client does not invert the card', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    // Without this, Apple Mail and Outlook auto-invert: the brand green button
    // becomes a colour nobody chose, and its label can end up unreadable.
    // `light dark` rather than `light`, because the mail now carries its own
    // dark palette and has no reason to ask to be left alone in light mode.
    const html = payload().htmlContent;
    expect(html).toContain('name="color-scheme" content="light dark"');
    expect(html).toContain('name="supported-color-schemes" content="light dark"');
  });

  it('carries a dark palette behind a prefers-color-scheme query', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    const html = payload().htmlContent;
    expect(html).toContain('@media (prefers-color-scheme: dark)');

    // Every rule in that block overrides an inline style on the same element,
    // and inline wins on specificity. A rule that loses the !important stops
    // doing anything at all, silently.
    const block = html.slice(
      html.indexOf('@media (prefers-color-scheme: dark)'),
      html.indexOf('</style>'),
    );
    const declarations = block.match(/[a-z-]+:\s*#[0-9a-fA-F]{3,8}[^;]*;/g) ?? [];

    expect(declarations.length).toBeGreaterThan(5);
    for (const declaration of declarations) {
      expect(declaration).toContain('!important');
    }
  });

  it('keeps the light rendering entirely inline, so stripping <style> is safe', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    const html = payload().htmlContent;
    const withoutStyleBlock = html.replace(/<style>[\s\S]*?<\/style>/, '');

    // Most clients drop <style>. What is left has to be the finished light
    // mail, not a half-styled one — so the light colours live inline and the
    // block only ever overrides them.
    expect(withoutStyleBlock).toContain('background:#f5f5f5');
    expect(withoutStyleBlock).toContain('background:#ffffff');
    expect(withoutStyleBlock).toContain('color:#2f2f2f');
    expect(withoutStyleBlock).toContain('bgcolor="#8DC63F"');
  });

  it('keeps the logo on a light plate in dark mode', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    /*
     * The logo is dark-grey line art with a dark-teal wordmark, drawn for a
     * light ground. Now that it is transparent it takes the colour behind it,
     * so letting the header band go dark makes the frog and half the wordmark
     * vanish — the transparency makes this worse, not better, than the old
     * opaque file did.
     */
    const html = payload().htmlContent;
    const block = html.slice(
      html.indexOf('@media (prefers-color-scheme: dark)'),
      html.indexOf('</style>'),
    );

    expect(block).toContain('.fmf-logo-band');
    expect(block).toMatch(/\.fmf-logo-band\s*\{[^}]*#ffffff/);
  });

  it('gives every layout table border="0"', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en');

    // Clients that predate CSS layout draw a visible border on a table that
    // does not say otherwise, framing the whole mail in grey lines.
    const html = payload().htmlContent;
    const tables = html.match(/<table[^>]*>/g) ?? [];
    expect(tables.length).toBeGreaterThan(0);
    for (const tag of tables) expect(tag).toContain('border="0"');
  });

  it('carries no emoji into the inbox', async () => {
    const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

    for (const lang of ['en', 'de', 'fr', 'tr', 'es'] as const) {
      fetchMock.mockClear();
      await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, lang);

      const body = payload();
      expect(EMOJI.test(body.subject)).toBe(false);
      expect(EMOJI.test(body.textContent)).toBe(false);
    }
  });

  it('falls back to English for an unsupported language code', async () => {
    // Cast bypasses the LangCode type to exercise the runtime fallback path
    // (e.g. a value that slipped past the API route's zod validation).
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'xx' as never);

    const body = payload();
    expect(body.subject).toBe(emailResources.en.magicLink.subject);
    expect(body.headers['Content-Language']).toBe('en');
    expect(body.htmlContent).toContain('<html lang="en"');
  });

  it('defaults to English when no language is passed', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN);

    expect(payload().subject).toBe(emailResources.en.magicLink.subject);
  });

  it('throws when Brevo responds with a non-ok status', async () => {
    fetchMock.mockResolvedValue(new Response('rejected sender', { status: 400 }));

    await expect(
      sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en'),
    ).rejects.toThrow('brevo_send_failed: 400');
  });
});
