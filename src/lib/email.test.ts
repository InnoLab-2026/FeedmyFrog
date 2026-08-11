import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { BREVO_API_KEY: 'xkeysib-test', MAGIC_LINK_TTL_MINUTES: 15 },
}));

const { sendMagicLink } = await import('./email');

const URL_TOKEN = 'https://feedmyfrog.click/verify-prompt?token=abc123';

describe('sendMagicLink', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

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

    const body = JSON.parse(init.body);
    expect(body.to).toEqual([{ email: 'anna@reutlingen-university.de' }]);
  });

  it.each([
    ['en', 'Your login link'],
    ['de', 'Anmeldelink für den Dienstleistungs-Exchange'],
    ['fr', 'Votre lien de connexion'],
    ['tr', 'Giriş bağlantınız'],
    ['es', 'Tu enlace de acceso'],
  ] as const)('uses the %s subject and embeds the link + ttl in the body', async (lang, subject) => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, lang);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(body.subject).toBe(subject);
    expect(body.textContent).toContain(URL_TOKEN);
    expect(body.textContent).toContain('15');
  });

  it('falls back to English for an unsupported language code', async () => {
    // Cast bypasses the LangCode type to exercise the runtime fallback path
    // (e.g. a value that slipped past the API route's zod validation).
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'xx' as never);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.subject).toBe('Your login link');
  });

  it('defaults to English when no language is passed', async () => {
    await sendMagicLink('anna@reutlingen-university.de', URL_TOKEN);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.subject).toBe('Your login link');
  });

  it('throws when Brevo responds with a non-ok status', async () => {
    fetchMock.mockResolvedValue(new Response('rejected sender', { status: 400 }));

    await expect(
      sendMagicLink('anna@reutlingen-university.de', URL_TOKEN, 'en'),
    ).rejects.toThrow('brevo_send_failed: 400');
  });
});
