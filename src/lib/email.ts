import 'server-only';
import { Resend } from 'resend';
import { env } from '@/lib/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendMagicLink(email: string, url: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Anmeldelink für den Dienstleistungs-Exchange',
    text:
      `Hallo,\n\n` +
      `klicken Sie auf den folgenden Link, um sich anzumelden. ` +
      `Der Link ist ${env.MAGIC_LINK_TTL_MINUTES} Minuten gültig und kann nur einmal verwendet werden.\n\n` +
      `${url}\n\n` +
      `Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.`,
  });
  if (error) {
    throw new Error(`resend_send_failed: ${error.name} ${error.message}`);
  }
}
