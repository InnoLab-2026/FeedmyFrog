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

const SENDER = { name: APP_NAME, email: 'noreply@feedmyfrog.click' } as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e6e6;">
<tr>
<td align="center" style="background:#8DC63F;padding:28px 24px;">
<img src="https://www.feedmyfrog.click/feedmyfrog.jpg" width="120" alt="feedmyfrog" style="display:block;border:0;max-width:120px;height:auto;">
<p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#1a3200;">feedmyfrog</p>
</td>
</tr>
<tr>
<td style="padding:32px 28px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#2f2f2f;">
<p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#2f2f2f;">${escapeHtml(copy.greeting)}</p>
<p style="margin:0 0 28px;color:#555;">${escapeHtml(copy.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr>
<td bgcolor="#8DC63F" style="border-radius:10px;border:1px solid #d0d0d0;">
<a href="${href}" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#1a3200;text-decoration:none;">${escapeHtml(copy.action)}</a>
</td>
</tr>
</table>
<p style="margin:0 0 20px;font-size:14px;color:#6a6a6a;">${validity}</p>
<p style="margin:0 0 8px;font-size:13px;color:#8a8a8a;">${escapeHtml(copy.fallbackIntro)}</p>
<p style="margin:0;font-size:12px;word-break:break-all;"><a href="${href}" style="color:#659629;">${href}</a></p>
</td>
</tr>
<tr>
<td style="padding:16px 28px 24px;border-top:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#9a9a9a;">
${escapeHtml(copy.ignore)}
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