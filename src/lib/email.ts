import 'server-only';
import { env } from '@/lib/env';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Hardcoded transactional sender. `feedmyfrog.click` is verified in Brevo with
 * a published DKIM signature and a configured DMARC policy, so mail from this
 * address passes authentication and reaches the inbox. Keeping it in code (not
 * an env var) guarantees every magic link goes out from the one domain we know
 * is authenticated — a misconfigured env can't silently swap in an unverified
 * sender that Brevo would reject after returning 201.
 */
const SENDER = { name: 'The Team', email: 'noreply@feedmyfrog.click' } as const;

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email }],
      subject: 'Anmeldelink für den Dienstleistungs-Exchange',
      textContent:
        `Hallo,\n\n` +
        `klicken Sie auf den folgenden Link, um sich anzumelden. ` +
        `Der Link ist ${env.MAGIC_LINK_TTL_MINUTES} Minuten gültig und kann nur einmal verwendet werden.\n\n` +
        `${url}\n\n` +
        `Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`brevo_send_failed: ${res.status} ${detail}`);
  }
}
