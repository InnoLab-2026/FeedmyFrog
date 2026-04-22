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

export const ListingType = z.enum(['need', 'offer']);

export const ListingInput = z.object({
  type:        ListingType,
  title:       z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  tags:        z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  location:    z.string().trim().min(1).max(80),
});

export const Uuid = z.string().uuid();
