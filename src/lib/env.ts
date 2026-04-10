import 'server-only';
import { z } from 'zod';

const Schema = z
  .object({
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(64),
    MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
    RESEND_API_KEY: z.string().startsWith('re_'),
    EMAIL_FROM: z.string().min(1),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_INSTITUTION_DOMAIN: z.string().min(1),
    ALLOWED_EMAIL_DOMAIN: z.string().min(1),
    RATE_LIMIT_SEND_LINK_PER_IP: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_SEND_LINK_PER_EMAIL: z.coerce.number().int().positive().default(5),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  })
  .refine(
    (e) => e.NEXT_PUBLIC_INSTITUTION_DOMAIN === e.ALLOWED_EMAIL_DOMAIN,
    { message: 'NEXT_PUBLIC_INSTITUTION_DOMAIN must equal ALLOWED_EMAIL_DOMAIN' },
  );

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = Object.freeze(parsed.data);
