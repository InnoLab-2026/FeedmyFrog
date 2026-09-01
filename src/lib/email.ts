import 'server-only';
import { env } from '@/lib/env';
import { APP_NAME } from '@/constants';
import {
  emailResources,
  interpolate,
  type MagicLinkCopy,
} from '@/i18n/emailResources';
import type { LangCode } from '@/i18n/translations';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/**
 * Hardcoded transactional sender. `feedmyfrog.click` is verified in Brevo with
 * a published DKIM signature and a configured DMARC policy, so mail from this
 * address passes authentication and reaches the inbox. Keeping it in code (not
 * an env var) guarantees every magic link goes out from the one domain we know
 * is authenticated — a misconfigured env can't silently swap in an unverified
 * sender that Brevo would reject after returning 201.
 *
 * The display name is the product name: recipients recognise the sender in the
 * inbox list, which is why the subject lines do not need to repeat it.
 */
const SENDER = { name: APP_NAME, email: 'noreply@feedmyfrog.click' } as const;

/** Escapes text for interpolation into the HTML part. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The plain-text part.
 *
 * Not a fallback anyone should have to read out of pity: some clients are
 * configured to prefer text, and spam filters weigh a message whose text part
 * is missing or empty. Blank lines do the formatting — no markup, no
 * line-wrapping guesses about the recipient's window.
 */
function renderText(copy: MagicLinkCopy, url: string, minutes: number): string {
  return [
    copy.greeting,
    '',
    copy.intro,
    interpolate(copy.validity, { minutes }),
    '',
    url,
    '',
    copy.ignore,
    '',
    '—',
    APP_NAME,
  ].join('\n');
}

/**
 * The HTML part.
 *
 * Written the way transactional mail has to be written rather than the way a
 * web page is: tables for layout and inline styles only, because mail clients
 * strip <style> blocks and have no reliable flexbox; a fixed 600px content
 * column, which is the width every client renders without horizontal scroll;
 * and the link repeated as selectable text underneath the button, because a
 * button that a client refuses to render must not strand the reader.
 *
 * `lang` is set on <html> so a screen reader announces the mail in the right
 * language, and the preheader gives the inbox preview line something better
 * than the first words of the greeting.
 */
function renderHtml(
  copy: MagicLinkCopy,
  url: string,
  minutes: number,
  language: LangCode,
): string {
  const href = escapeHtml(url);
  const preheader = escapeHtml(interpolate(copy.preheader, { minutes }));
  const validity = escapeHtml(interpolate(copy.validity, { minutes }));

  return `<!doctype html>
<html lang="${language}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f5; -webkit-text-size-adjust:100%;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; background:#ffffff; border:1px solid rgba(47,47,47,0.15); border-radius:12px;">
<tr>
<td style="padding:32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:16px; line-height:1.6; color:#2f2f2f;">
<p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#659629;">${escapeHtml(APP_NAME)}</p>
<p style="margin:0 0 16px;">${escapeHtml(copy.greeting)}</p>
<p style="margin:0 0 24px;">${escapeHtml(copy.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
<tr>
<td align="center" bgcolor="#8DC63F" style="border-radius:8px;">
<a href="${href}" style="display:inline-block; padding:14px 28px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:16px; font-weight:700; color:#1a3200; text-decoration:none; border-radius:8px;">${escapeHtml(copy.action)}</a>
</td>
</tr>
</table>
<p style="margin:0 0 24px; font-size:14px; color:#5f5f5f;">${validity}</p>
<p style="margin:0 0 8px; font-size:14px; color:#5f5f5f;">${escapeHtml(copy.fallbackIntro)}</p>
<p style="margin:0 0 24px; font-size:13px; word-break:break-all;"><a href="${href}" style="color:#659629;">${href}</a></p>
<hr style="border:none; border-top:1px solid rgba(47,47,47,0.12); margin:0 0 16px;">
<p style="margin:0; font-size:13px; color:#8a8377;">${escapeHtml(copy.ignore)}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

export async function sendMagicLink(
  email: string,
  url: string,
  lang: LangCode = 'en',
): Promise<void> {
  const copy = (emailResources[lang] ?? emailResources.en).magicLink;
  const language = lang in emailResources ? lang : 'en';
  const minutes = env.MAGIC_LINK_TTL_MINUTES;

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
      subject: copy.subject,
      // Both parts, always: clients that prefer text get a real message, and
      // a missing text part is a spam-score penalty on its own.
      htmlContent: renderHtml(copy, url, minutes, language),
      textContent: renderText(copy, url, minutes),
      headers: { 'Content-Language': language },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`brevo_send_failed: ${res.status} ${detail}`);
  }
}
