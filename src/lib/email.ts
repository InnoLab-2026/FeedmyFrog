import 'server-only';
import { env } from '@/lib/env';
import type { LangCode } from '@/i18n/translations';

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

const EMAIL_TEMPLATES: Record<
  LangCode,
  { subject: string; body: (url: string, ttlMinutes: number) => string }
> = {
  en: {
    subject: 'Your login link',
    body: (url, ttl) =>
      `Hello,\n\n` +
      `Click the link below to sign in. The link is valid for ${ttl} minutes and can only be used once.\n\n` +
      `${url}\n\n` +
      `If you did not request this email, you can safely ignore it.`,
  },
  de: {
    subject: 'Anmeldelink für den Dienstleistungs-Exchange',
    body: (url, ttl) =>
      `Hallo,\n\n` +
      `klicken Sie auf den folgenden Link, um sich anzumelden. ` +
      `Der Link ist ${ttl} Minuten gültig und kann nur einmal verwendet werden.\n\n` +
      `${url}\n\n` +
      `Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.`,
  },
  fr: {
    subject: 'Votre lien de connexion',
    body: (url, ttl) =>
      `Bonjour,\n\n` +
      `Cliquez sur le lien ci-dessous pour vous connecter. Le lien est valable ${ttl} minutes et ne peut être utilisé qu'une seule fois.\n\n` +
      `${url}\n\n` +
      `Si vous n'avez pas demandé cet e-mail, vous pouvez l'ignorer.`,
  },
  tr: {
    subject: 'Giriş bağlantınız',
    body: (url, ttl) =>
      `Merhaba,\n\n` +
      `Giriş yapmak için aşağıdaki bağlantıya tıklayın. Bağlantı ${ttl} dakika geçerlidir ve yalnızca bir kez kullanılabilir.\n\n` +
      `${url}\n\n` +
      `Bu e-postayı siz talep etmediyseniz göz ardı edebilirsiniz.`,
  },
  es: {
    subject: 'Tu enlace de acceso',
    body: (url, ttl) =>
      `Hola,\n\n` +
      `Haz clic en el siguiente enlace para iniciar sesión. El enlace es válido durante ${ttl} minutos y solo se puede usar una vez.\n\n` +
      `${url}\n\n` +
      `Si no has solicitado este correo, puedes ignorarlo.`,
  },
};

export async function sendMagicLink(
  email: string,
  url: string,
  lang: LangCode = 'en',
): Promise<void> {
  const template = EMAIL_TEMPLATES[lang] ?? EMAIL_TEMPLATES.en;

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
      subject: template.subject,
      textContent: template.body(url, env.MAGIC_LINK_TTL_MINUTES),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`brevo_send_failed: ${res.status} ${detail}`);
  }
}
