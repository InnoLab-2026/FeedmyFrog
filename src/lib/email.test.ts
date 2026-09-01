import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { BREVO_API_KEY: 'xkeysib-test', MAGIC_LINK_TTL_MINUTES: 15 },
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
