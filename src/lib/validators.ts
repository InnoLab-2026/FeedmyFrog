import { z } from 'zod';
import { env } from '@/lib/env';

/**
 * Returns true iff `email`'s domain part is exactly `baseDomain` OR a
 * proper subdomain of it. The `.`-separator check on the subdomain branch
 * is what makes this safe — `evil-reutlingen-university.de` and
 * `reutlingen-university.de.attacker.com` are both rejected because they
 * fail BOTH the equality check AND the `.<base>` suffix check.
 */
export function isAllowedEmail(email: string, baseDomain: string): boolean {
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  const base = baseDomain.toLowerCase();
  return domain === base || domain.endsWith('.' + base);
}

export const Email = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .refine((e) => isAllowedEmail(e, env.ALLOWED_EMAIL_DOMAIN), {
    message: 'forbidden_domain',
  });

export const ListingType = z.enum(['need', 'offer'], { message: 'type_invalid' });

/**
 * Every constraint below carries a short machine-readable code (not prose)
 * as its message — the same convention as Email's `forbidden_domain` above.
 * Server actions pass these codes straight through to the client; the
 * client is the only layer that knows the user's language, so it maps
 * `error_<code>` to a translated string via i18n. Never put user-facing
 * text in a validator message — it can only ever render in whatever
 * language the server happens to run in.
 */
export const ListingInput = z.object({
  type:        ListingType,
  title:       z.string().trim().min(3, 'title_too_short').max(120, 'title_too_long'),
  description: z.string().trim().min(10, 'description_too_short').max(2000, 'description_too_long'),
  tags:        z.array(z.string().trim().min(1, 'tag_empty').max(40, 'tag_too_long')).max(8, 'tags_too_many').default([]),
  location:    z.string().trim().min(1, 'location_required').max(80, 'location_too_long'),
});

export const Uuid = z.string().uuid({ message: 'invalid_id' });
