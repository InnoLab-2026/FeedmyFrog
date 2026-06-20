import 'server-only';
import { env } from '@/lib/env';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

type Sender = { name?: string; email: string };

/**
 * Brevo's transactional API wants a structured sender ({ name, email }),
 * but EMAIL_FROM is the RFC-5322-style combined string "Name <email>"
 * (or possibly a bare "email" with no display name).
 *
 *   "Dienstleistungs-Exchange <noreply@reutlingen-university.de>"
 *        -> { name: 'Dienstleistungs-Exchange', email: 'noreply@reutlingen-university.de' }
 *   "noreply@reutlingen-university.de"
 *        -> { email: 'noreply@reutlingen-university.de' }
 *
 * Fail-fast: a malformed EMAIL_FROM throws here rather than being forwarded to
 * Brevo, which would reject it with a vaguer error. On the magic-link path a
 * misconfigured sender blocks every login, so we want the loudest signal.
 */
function parseSender(value: string): Sender {
  const named = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (named) {
    const [, name, email] = named;
    return name ? { name, email: email.trim() } : { email: email.trim() };
  }
  const bare = value.trim();
  if (bare.includes('@')) {
    return { email: bare };
  }
  throw new Error(`invalid_email_from: ${JSON.stringify(value)}`);
}

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: parseSender(env.EMAIL_FROM),
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
