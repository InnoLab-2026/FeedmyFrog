import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendMagicLink } from './email';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendMagicLink', () => {
  it('POSTs the magic link to the Brevo transactional endpoint', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 201 }));

    await sendMagicLink('alice@reutlingen-university.de', 'https://app.example/verify?token=xyz');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init?.method).toBe('POST');

    const headers = init?.headers as Record<string, string>;
    expect(headers['api-key']).toBe('xkeysib-test-key');
    expect(headers['content-type']).toBe('application/json');

    const body = JSON.parse(init?.body as string);
    expect(body.sender).toEqual({ name: 'The Team', email: 'noreply@feedmyfrog.click' });
    expect(body.to).toEqual([{ email: 'alice@reutlingen-university.de' }]);
    expect(body.textContent).toContain('https://app.example/verify?token=xyz');
    // TTL from the test env (MAGIC_LINK_TTL_MINUTES=15) is surfaced to the user.
    expect(body.textContent).toContain('15 Minuten');
  });

  it('throws with the status code when Brevo responds with a non-2xx status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('bad key', { status: 401 }),
    );

    await expect(
      sendMagicLink('alice@reutlingen-university.de', 'https://app.example/verify'),
    ).rejects.toThrow(/brevo_send_failed: 401/);
  });
});
