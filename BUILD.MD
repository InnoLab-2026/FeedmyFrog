# Build Guide

This document walks through building the Dienstleistungs-Exchange from
an empty directory to a production-ready application. The guide is
divided into five phases, followed by an API reference, a component
architecture note, and a security section. Each phase ends in a state
that can be tested in isolation, so it is safe to stop and resume.

The component layout in `src/components/` deliberately mirrors the
Figma reference package (`Waymakrdesignfigma-main.zip`) one-to-one.
File names, prop signatures, and folder structure match the design
package, so a future iteration shipped by the designer is a
drag-and-drop swap rather than a port. The design philosophy is
documented in [Component architecture](#component-architecture).

## Contents

1. [Prerequisites](#1-prerequisites)
2. [Phase 1: Project bootstrap](#phase-1-project-bootstrap)
3. [Phase 2: Database and schema](#phase-2-database-and-schema)
4. [Phase 3: Authentication](#phase-3-authentication)
5. [Phase 4: Application features](#phase-4-application-features)
6. [Phase 5: Deployment](#phase-5-deployment)
7. [API reference](#api-reference)
8. [Component architecture](#component-architecture)
9. [Security notes](#security-notes)

## 1. Prerequisites

Before starting, prepare the following:

- Node.js 20 LTS (the same version is pinned in `package.json` later)
- npm
- A GitHub repository for the project
- A Neon account with a project in the Frankfurt region
  (`eu-central-1`)
- A Brevo account with a verified sending domain (DNS records
  printed by the Brevo dashboard: SPF, DKIM, and a DMARC policy of
  at least `p=none`). Provision the account on Brevo's EU
  infrastructure to keep email data within the EU.
- A Vercel account linked to the same GitHub organisation
- The Figma reference package `Waymakrdesignfigma-main.zip` extracted
  somewhere accessible. The build copies file contents from it
  verbatim. The package itself is not committed to the application
  repository; treat it as a design source-of-truth.

The Neon dashboard provides a connection string of the form
`postgresql://<user>:<password>@<host>.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`.
Keep it ready for Phase 2.

---

## Phase 1: Project bootstrap

### Step 1. Create the Next.js project

```bash
npx create-next-app@latest dienstleistungs-exchange
cd dienstleistungs-exchange
```

When prompted, choose:

- TypeScript: yes
- ESLint: yes
- Tailwind CSS: **yes** (the Figma components rely on Tailwind utility
  classes; the build is no longer optional)
- `src/` directory: yes
- App Router: yes
- Turbopack for `next dev`: yes
- Custom import alias: no (keep `@/*`)

### Step 2. Pin the Node version

Edit `package.json` and add an `engines` field so Vercel and local
contributors run the same Node release:

```json
{
  "engines": {
    "node": ">=20.11 <21"
  }
}
```

### Step 3. Install runtime dependencies

```bash
npm install drizzle-orm @neondatabase/serverless jose zod server-only \
  lucide-react i18next react-i18next
```

Application stack:

- `drizzle-orm`, `@neondatabase/serverless` — ORM + Neon HTTP driver.
- `jose` — JWT signing/verification, Edge-runtime safe (used by
  middleware).
- `zod` — input validation in Server Actions, route handlers, and the
  environment validator.
- Brevo transactional email — magic-link delivery via the REST API
  (called with `fetch`; no SDK dependency).
- `server-only` — guard module. Importing it inside a file makes the
  Next.js bundler refuse to ship that file in any client bundle.

Design package dependencies:

- `lucide-react` — icon set used by every Figma component.
- `i18next`, `react-i18next` — used verbatim by the Figma components.
  Five languages (EN, DE, FR, TR, ES) ship in `src/i18n/translations.ts`.

### Step 4. Install development dependencies

```bash
npm install -D drizzle-kit dotenv tsx
```

`drizzle-kit` generates and applies migrations. `tsx` is for ad-hoc
TypeScript scripts (for example a one-off seed script).

### Step 5. Initialise environment variables

Create `.env.example` at the project root:

```env
# Database (Neon, Frankfurt region)
DATABASE_URL=

# Auth
AUTH_SECRET=
MAGIC_LINK_TTL_MINUTES=15
SESSION_TTL_DAYS=30

# Email
BREVO_API_KEY=
EMAIL_FROM="Dienstleistungs-Exchange <noreply@reutlingen-university.de>"

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_INSTITUTION_DOMAIN=reutlingen-university.de
ALLOWED_EMAIL_DOMAIN=reutlingen-university.de

# Rate limits (per hour, per dimension)
RATE_LIMIT_SEND_LINK_PER_IP=10
RATE_LIMIT_SEND_LINK_PER_EMAIL=5
```

`NEXT_PUBLIC_INSTITUTION_DOMAIN` is read by the disclaimer overlay
(client component) to render the domain in five languages without
hard-coding. It must equal `ALLOWED_EMAIL_DOMAIN`; the env validator
in Step 6 enforces this invariant.

Copy `.env.example` to `.env.local` and fill in real values. Generate
`AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6. Validate environment variables at startup

Create `src/lib/env.ts`. This is the only module that reads
`process.env` directly. Every other server module imports `env` from
here, so a missing or malformed variable fails fast at boot rather
than mid-request.

```ts
import 'server-only';
import { z } from 'zod';

const Schema = z
  .object({
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(64),
    MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(15),
    SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
    BREVO_API_KEY: z.string().startsWith('xkeysib-'),
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
```

### Step 7. Security headers

Replace `next.config.ts` at the project root. Every response carries
the same baseline headers; per-route overrides can be added later.

```ts
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default config;
```

`'unsafe-inline'` for scripts is regrettable but required by the
default Next.js bootstrap. Tightening with nonces is documented in
[Security notes](#security-notes).

### Checkpoint

Run `npm run dev` and confirm the default page loads at
`http://localhost:3000`. Open the browser network tab and verify the
security headers above. If `env.ts` validation fails, the dev server
refuses to start and prints the offending variables.

---

## Phase 2: Database and schema

### Step 8. Configure Drizzle

Create `drizzle.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### Step 9. Define the schema

Create `src/db/schema.ts`. The `listings` row shape mirrors the Figma
`Listing` interface exactly so that components consume DB rows without
a mapping layer.

```ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const listingType = pgEnum('listing_type', ['need', 'offer']);

export const listings = pgTable(
  'listings',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    userId:      text('user_id').notNull(),
    email:       text('email').notNull(),
    type:        listingType('type').notNull(),
    title:       text('title').notNull(),
    description: text('description').notNull(),
    tags:        text('tags').array().notNull().default([]),
    location:    text('location').notNull(),
    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listings_type_created').on(t.type, t.createdAt.desc()),
    index('idx_listings_user').on(t.userId),
  ],
);

export const magicTokens = pgTable(
  'magic_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    email:     text('email').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumed:  boolean('consumed').default(false).notNull(),
  },
  (t) => [
    index('idx_magic_tokens_email').on(t.email),
    index('idx_magic_tokens_expires').on(t.expiresAt),
  ],
);

export const rateLimits = pgTable(
  'rate_limits',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    key:       text('key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_rate_limits_key_created').on(t.key, t.createdAt)],
);
```

`listing_type` is a Postgres enum so the constraint is database-side
rather than application-side. Tags are a `text[]` so the design's
`tags: string[]` shape carries through unchanged.

### Step 10. Create the Drizzle client

Create `src/db/client.ts`:

```ts
import 'server-only';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '@/lib/env';
import * as schema from './schema';

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

### Step 11. Generate and apply the first migration

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Commit the file written under `drizzle/` to the repository — it is
the source of truth for the production schema.

### Checkpoint

In the Neon console, confirm three tables (`listings`, `magic_tokens`,
`rate_limits`), one enum (`listing_type`), and the listed indexes
exist in the `public` schema.

---

## Phase 3: Authentication

The flow is described in the README. This phase implements it across
seven files: token helpers, session helpers, an email helper, a rate
limiter, a shared validator module, the send-link route, and the
verification route.

### Step 12. Token helpers

Create `src/lib/auth.ts`:

```ts
import 'server-only';
import { randomBytes, createHash } from 'node:crypto';

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function userIdFromEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}
```

Only the SHA-256 hash of a token reaches the database. A leak yields
no usable login material — an attacker would need a SHA-256 preimage.

### Step 13. Session helpers

Create `src/lib/session.ts`. The same code runs on the Node runtime
(route handlers, Server Actions) and the Edge runtime (middleware).

```ts
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { env } from '@/lib/env';

const SECRET = new TextEncoder().encode(env.AUTH_SECRET);

export const SESSION_COOKIE = env.NODE_ENV === 'production'
  ? '__Host-session'
  : 'session';

const Payload = z.object({
  userId: z.string().regex(/^[a-f0-9]{64}$/),
  email: z.string().email(),
});
export type Session = z.infer<typeof Payload>;

export async function createSession(s: Session): Promise<void> {
  const days = env.SESSION_TTL_DAYS;
  const jwt = await new SignJWT(s)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(SECRET);

  (await cookies()).set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const jwt = jar.get(SESSION_COOKIE)?.value ?? jar.get('session')?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, SECRET, { clockTolerance: 30 });
    const result = Payload.safeParse(payload);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete('session');
}
```

### Step 14. Email helper

Create `src/lib/email.ts`:

```ts
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
```

### Step 15. Rate limiter

Create `src/lib/rate-limit.ts`. Counters live in the `rate_limits`
Postgres table. Under bursts the limit may be exceeded by a small
amount; this is acceptable for an abuse-prevention check.

```ts
import 'server-only';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { rateLimits } from '@/db/schema';

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

export async function checkAndConsume(
  key: string,
  max: number,
  windowMs: number,
): Promise<LimitResult> {
  const since = new Date(Date.now() - windowMs);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rateLimits)
    .where(and(eq(rateLimits.key, key), gte(rateLimits.createdAt, since)));

  if (count >= max) {
    return { ok: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  await db.insert(rateLimits).values({ key });
  return { ok: true, remaining: Math.max(0, max - count - 1) };
}

export async function cleanupRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  await db.delete(rateLimits).where(lt(rateLimits.createdAt, cutoff));
}
```

### Step 16. Shared validators

Create `src/lib/validators.ts`. The `Listing` schema mirrors the
Figma `Listing` interface from `src/types.ts` (Step 19) so Server
Actions reject anything that would not round-trip through a
ListingCard.

The `Email` schema accepts the configured apex domain *and* any
subdomain of it (e.g. with `ALLOWED_EMAIL_DOMAIN=reutlingen-university.de`,
both `user@reutlingen-university.de` and
`user@student.reutlingen-university.de` are valid). The check is
deliberately split into "equals base" or "ends with `.<base>`" so that
look-alike domains cannot squeeze through:

| Address                                              | Verdict   | Why |
|------------------------------------------------------|-----------|-----|
| `user@reutlingen-university.de`                      | accepted  | exact apex match |
| `user@student.reutlingen-university.de`              | accepted  | ends with `.<base>` |
| `user@lb.reutlingen-university.de`                   | accepted  | ends with `.<base>` |
| `user@evil-reutlingen-university.de`                 | rejected  | no `.` separator before `<base>` |
| `user@reutlingen-university.de.attacker.com`         | rejected  | `<base>` not at the right position |
| `user@notreutlingen-university.de`                   | rejected  | same |

```ts
import { z } from 'zod';
import { env } from '@/lib/env';

/**
 * Returns true iff `email`'s domain part is exactly `baseDomain` OR a
 * proper subdomain of it. The `.`-separator check on the subdomain
 * branch is what makes this safe against look-alike domains.
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
```

Subdomain acceptance is always-on; if a future deployment needs
apex-only, gate the subdomain branch behind an env var.

### Step 17. Send-link route

Create `src/app/api/auth/send-link/route.ts`:

```ts
import 'server-only';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, eq, lt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { generateToken } from '@/lib/auth';
import { sendMagicLink } from '@/lib/email';
import { checkAndConsume, cleanupRateLimits } from '@/lib/rate-limit';
import { Email } from '@/lib/validators';
import { env } from '@/lib/env';

const Body = z.object({ email: Email });
const HOUR = 60 * 60 * 1000;

export async function POST(req: Request) {
  const ct = req.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('application/json')) {
    return NextResponse.json({ error: 'unsupported_media_type' }, { status: 415 });
  }

  let json: unknown;
  try { json = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === 'forbidden_domain') {
      return NextResponse.json({ error: 'forbidden_domain' }, { status: 403 });
    }
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const email = parsed.data.email;
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';

  const ipLimit = await checkAndConsume(`send-link:ip:${ip}`, env.RATE_LIMIT_SEND_LINK_PER_IP, HOUR);
  const emailLimit = await checkAndConsume(`send-link:email:${email}`, env.RATE_LIMIT_SEND_LINK_PER_EMAIL, HOUR);

  if (!ipLimit.ok || !emailLimit.ok) {
    const retry = !ipLimit.ok ? ipLimit.retryAfterSeconds : emailLimit.retryAfterSeconds;
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(retry) } },
    );
  }

  // Invalidate prior unconsumed tokens for this email.
  await db
    .update(magicTokens)
    .set({ consumed: true })
    .where(and(eq(magicTokens.email, email), eq(magicTokens.consumed, false)));

  // Best-effort housekeeping.
  await db.delete(magicTokens).where(lt(magicTokens.expiresAt, new Date(Date.now() - 7 * 24 * HOUR)));
  await cleanupRateLimits();

  const ttlMs = env.MAGIC_LINK_TTL_MINUTES * 60 * 1000;
  const { raw, hash } = generateToken();
  await db.insert(magicTokens).values({
    tokenHash: hash,
    email,
    expiresAt: new Date(Date.now() + ttlMs),
  });

  const url = `${env.NEXT_PUBLIC_BASE_URL}/verify?token=${encodeURIComponent(raw)}`;
  await sendMagicLink(email, url);

  return NextResponse.json({ ok: true }, { status: 202 });
}
```

### Step 18. Verification route

Create `src/app/(auth)/verify/route.ts`. The atomic
`UPDATE … RETURNING` collapses lookup, expiry check, and consume-mark
into one statement.

```ts
import 'server-only';
import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { hashToken, userIdFromEmail } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('token');
  if (!raw || raw.length > 100) {
    return NextResponse.redirect(new URL('/login?e=missing', url));
  }

  const hash = hashToken(raw);
  const [row] = await db
    .update(magicTokens)
    .set({ consumed: true })
    .where(
      and(
        eq(magicTokens.tokenHash, hash),
        eq(magicTokens.consumed, false),
        gt(magicTokens.expiresAt, new Date()),
      ),
    )
    .returning({ email: magicTokens.email });

  if (!row) {
    return NextResponse.redirect(new URL('/login?e=invalid', url));
  }

  await createSession({
    userId: userIdFromEmail(row.email),
    email: row.email,
  });

  return NextResponse.redirect(new URL('/', url));
}
```

The post-login redirect target is `/` (the marketplace), matching the
Figma design's single-page shape.

### Checkpoint

The login form does not yet exist; that is fine. Test the API by
posting JSON to `/api/auth/send-link` with `curl`:

```bash
curl -X POST http://localhost:3000/api/auth/send-link \
  -H 'content-type: application/json' \
  -d '{"email":"you@reutlingen-university.de"}'
```

The email should arrive within seconds. Click the link; the response
sets a session cookie and redirects to `/` (404 until Phase 4 adds
the page).

---

## Phase 4: Application features

### Step 19. Shared types and constants

The Figma design exposes one cross-cutting type (`Listing`, `Mode`,
`Category`) and three string constants. They sit at the top of the
`src/` tree because both server and client code import them.

Create `src/types.ts` (verbatim from the design package):

```ts
import type { ReactNode } from 'react';

export type Mode = 'need' | 'offer';

export interface Listing {
  id: string;
  title: string;
  description: string;
  tags: string[];
  location: string;
  email: string;
  type: Mode;
}

export interface Category {
  id: string;
  label: string;
  icon: ReactNode;
}
```

Create `src/constants.ts`:

```ts
export const INSTITUTION_NAME = 'Reutlingen University';
export const SUBTITLE         = 'Exchange Platform';
export const CARD_SHADOW      =
  '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)';
```

### Step 19a. Design tokens and fonts

The Figma components reference CSS custom properties (e.g.
`var(--font-family-display)`) and two Google fonts (Plus Jakarta Sans
and DM Sans). Copy two files from the design package and wire them
into the Tailwind globals so the tokens resolve.

Copy verbatim:

- `Waymakrdesignfigma-main/src/styles/theme.css` →
  `src/app/theme.css`
- `Waymakrdesignfigma-main/src/styles/fonts.css` →
  `src/app/fonts.css`

Edit `src/app/globals.css` (created by `create-next-app`) so it
imports the two new files alongside the Tailwind layers it already
contains. The exact contents the file ends up with depend on the
Next.js template version, but it must include:

```css
@import "tailwindcss";

@import "./fonts.css";
@import "./theme.css";
```

`fonts.css` declares the `@font-face` rules; `theme.css` defines the
`--font-family-base`, `--font-family-display`, color tokens, and the
`body` rules used by the design package. Tailwind 4's `@theme inline`
block in `theme.css` exposes the design tokens to the `text-*`,
`bg-*`, and `border-*` utilities the components consume.

If `globals.css` previously contained a `:root { --foreground: ... }`
or similar block from the Next.js template, delete it — the
authoritative tokens now live in `theme.css`, and a duplicate `:root`
block fights the design's values.

### Step 20. i18n setup

Create `src/i18n/translations.ts` by copying the file of the same name
from the Figma package (`Waymakrdesignfigma-main/src/app/i18n/translations.ts`).
It contains five language resource bundles and the `LANGUAGES` array.

Create `src/i18n/index.ts`:

```ts
'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
```

Create `src/i18n/Provider.tsx`:

```tsx
'use client';
import { type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './index';

export default function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```

The provider sits in the root layout (Step 26) and wraps the entire
client tree. Server components do not consume translations directly
in the MVP — every translated string is rendered inside a client
component, matching the design.

### Step 21. Tag-to-icon map

Copy `src/data/icons.tsx` from the design package
(`Waymakrdesignfigma-main/src/app/data/icons.tsx`) verbatim. The map
is data, not code: extending the marketplace with new tag icons
amounts to adding entries to this object.

```tsx
import { Users, Car, ShoppingBag, Briefcase, Baby, GraduationCap } from 'lucide-react';

export const iconMap: Record<string, React.ReactNode> = {
  Familie:          <Users className="w-4 h-4" />,
  Kinder:           <Baby className="w-4 h-4" />,
  Mobilität:        <Car className="w-4 h-4" />,
  Verkauf:          <ShoppingBag className="w-4 h-4" />,
  Dienstleistungen: <Briefcase className="w-4 h-4" />,
  Bildung:          <GraduationCap className="w-4 h-4" />,
};
```

### Step 22. Layout components

Each file in this step is copied verbatim from the design package
under `Waymakrdesignfigma-main/src/app/components/layout/`. Add
`'use client'` at the top of each — the originals run inside a Vite
SPA that has no server/client distinction, so all four files are
client components in the Next.js port.

- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/LanguageButton.tsx`

Adjust two import paths in `Header.tsx` after copying:

```diff
- import { INSTITUTION_NAME, SUBTITLE } from '../../constants';
+ import { INSTITUTION_NAME, SUBTITLE } from '@/constants';

- import DisclaimerOverlay from '../marketplace/DisclaimerOverlay';
+ import DisclaimerOverlay from '@/components/marketplace/DisclaimerOverlay';
```

Adjust the import in `LanguageButton.tsx`:

```diff
- import { LANGUAGES, type LangCode } from '../../i18n/translations';
+ import { LANGUAGES, type LangCode } from '@/i18n/translations';
```

`Header.tsx` accepts `searchQuery` and `onSearchChange` as props. It
does not own state. That contract is what makes it drag-and-drop
swappable: any redesign of the header must keep the same two props.

### Step 23. Marketplace components

Copy each file from
`Waymakrdesignfigma-main/src/app/components/marketplace/` to
`src/components/marketplace/` and add `'use client'` at the top:

- `ModeToggle.tsx`
- `CategoryTab.tsx`
- `CategoryTabs.tsx`
- `ListingCard.tsx`
- `PaginationControls.tsx`
- `DisclaimerOverlay.tsx`

Adjust import paths after copying. In each file replace the relative
imports (`'../../types'`, `'../../constants'`) with alias imports
(`'@/types'`, `'@/constants'`).

For `DisclaimerOverlay.tsx`, replace the hard-coded
`@<institution-domain>` placeholder with the actual configured
domain. The displayed string uses the `(*.)` notation to communicate
that subdomains are also accepted — matching the validator behavior
in Step 16:

```diff
- <span style={{ fontWeight: 700 }}>@&lt;institution-domain&gt;</span>{' '}
+ <span style={{ fontWeight: 700 }}>@(*.){process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN}</span>{' '}
```

Hoist the env read to the top of the file so the JSX stays clean:

```ts
const INSTITUTION_DOMAIN = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN ?? '';
```

This is the only place the design package falls short of being
configurable; the env var is exposed publicly precisely so the client
component can read it.

`ListingCard.tsx` already accepts `{ listing: Listing }` and renders
the email plainly (matching the access model: every viewer is an
authenticated member of the same institution). For the management
page (`/meine`) we extend the contract by accepting an optional
delete-action child. Replace the file's `interface ListingCardProps`
and `default export` with this version:

```tsx
'use client';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { Listing } from '@/types';
import { CARD_SHADOW } from '@/constants';

interface ListingCardProps {
  listing: Listing;
  /** Owner-only affordance (e.g. delete button) rendered below the card body. */
  ownerActions?: ReactNode;
}

export default function ListingCard({ listing, ownerActions }: ListingCardProps) {
  const { t } = useTranslation();

  const ariaLabel = [
    listing.title,
    listing.description,
    listing.tags.map(tag => t('aria_tag', { tag })).join(', '),
    t('aria_location', { location: listing.location }),
    `Email: ${listing.email}`,
  ].join('. ');

  return (
    <div
      className="p-6 cursor-pointer focus:outline-none"
      tabIndex={0}
      role="article"
      aria-label={ariaLabel}
      style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      onFocus={e => { e.currentTarget.style.outline = '3px solid black'; e.currentTarget.style.outlineOffset = '2px'; }}
      onBlur={e  => { e.currentTarget.style.outline = 'none'; }}
    >
      <h3 className="mb-2" style={{ fontFamily: 'var(--font-family-display)', fontWeight: 600, fontSize: '17px', lineHeight: 1.3 }}>
        {listing.title}
      </h3>
      <p className="mb-3" style={{ fontSize: '14px', lineHeight: 1.5 }}>{listing.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {listing.tags.map(tag => (
          <span key={tag} className="px-3 py-1 rounded-full text-xs"
            style={{ background: 'white', color: 'black', border: '2px solid black', fontWeight: 600 }}>
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between" style={{ fontSize: '13px', fontWeight: 500 }}>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>{listing.location}</span>
        </div>
        <a
          href={`mailto:${listing.email}`}
          className="hover:underline focus:outline-none"
          style={{ color: 'black' }}
          onClick={e => e.stopPropagation()}
          onFocus={e => { e.currentTarget.style.outline = '2px solid black'; e.currentTarget.style.outlineOffset = '2px'; }}
          onBlur={e  => { e.currentTarget.style.outline = 'none'; }}
        >
          {listing.email}
        </a>
      </div>
      {ownerActions && <div className="mt-4">{ownerActions}</div>}
    </div>
  );
}
```

The `ownerActions` slot is the only deviation from the design
package. It is opt-in: on the public marketplace page no actions are
passed, so the rendered card is byte-identical to the design.

### Step 24. Marketplace state-owner

The Figma design lifts every piece of marketplace state (mode,
search, category, page, items-per-page) into `App.tsx` and pipes it
through props. The Next.js port keeps that contract by introducing
one client wrapper that owns the state and composes the children.

Create `src/components/Marketplace.tsx`:

```tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Listing, Mode, Category } from '@/types';
import { iconMap } from '@/data/icons';
import Header from '@/components/layout/Header';
import ModeToggle from '@/components/marketplace/ModeToggle';
import CategoryTabs from '@/components/marketplace/CategoryTabs';
import PaginationControls from '@/components/marketplace/PaginationControls';
import ListingCard from '@/components/marketplace/ListingCard';

interface MarketplaceProps {
  listings: Listing[];
}

export default function Marketplace({ listings }: MarketplaceProps) {
  const { t } = useTranslation();
  const [mode, setMode]                         = useState<Mode>('need');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery]           = useState('');
  const [currentPage, setCurrentPage]           = useState(1);
  const [itemsPerPage, setItemsPerPage]         = useState(15);

  const categories = useMemo<Category[]>(() => {
    const counts: Record<string, number> = {};
    listings
      .filter(l => l.type === mode)
      .forEach(l => l.tags.forEach(tag => { counts[tag] = (counts[tag] || 0) + 1; }));

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => ({ id: tag, label: tag, icon: iconMap[tag] ?? <Search className="w-4 h-4" /> }));

    return [{ id: 'All', label: 'All', icon: <Search className="w-4 h-4" /> }, ...sorted];
  }, [listings, mode]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return listings.filter(l => {
      if (l.type !== mode) return false;
      if (selectedCategory !== 'All' && !l.tags.includes(selectedCategory)) return false;
      if (q && !l.title.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [listings, mode, selectedCategory, searchQuery]);

  const totalPages        = Math.max(1, Math.ceil(filteredListings.length / itemsPerPage));
  const paginatedListings = filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const showPagination    = filteredListings.length > 15;

  useEffect(() => { setSelectedCategory('All'); }, [mode]);
  useEffect(() => { setCurrentPage(1); }, [mode, selectedCategory, searchQuery, itemsPerPage]);

  return (
    <>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="max-w-[1400px] w-full mx-auto px-5 flex-grow pb-8">
        <ModeToggle mode={mode} onChange={setMode} />
        <CategoryTabs
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        {showPagination && (
          <div className="mb-6">
            <PaginationControls
              currentPage={currentPage} totalPages={totalPages}
              itemsPerPage={itemsPerPage} onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
        <div className="space-y-4">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: 'white', border: '2px solid black' }}>
                <Search className="w-7 h-7" />
              </div>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>{t('no_results')}</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>{t('try_different')}</p>
            </div>
          ) : (
            paginatedListings.map(listing => <ListingCard key={listing.id} listing={listing} />)
          )}
        </div>
        {showPagination && (
          <div className="mt-6">
            <PaginationControls
              currentPage={currentPage} totalPages={totalPages}
              itemsPerPage={itemsPerPage} onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </main>
    </>
  );
}
```

The component takes `listings: Listing[]` as input and owns
everything else. A future redesign of the page can replace this file
without touching the server boundary.

### Step 25. Server Actions

Create `src/actions/auth.ts`:

```ts
'use server';
import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/session';

export async function logout() {
  await destroySession();
  redirect('/login');
}
```

Create `src/actions/listings.ts`:

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { getSession } from '@/lib/session';
import { ListingInput, Uuid } from '@/lib/validators';

export type CreateState =
  | { ok: true }
  | { ok: false; errors: Record<string, string[]> };

export async function createListing(
  _prev: CreateState | null,
  formData: FormData,
): Promise<CreateState> {
  const session = await getSession();
  if (!session) redirect('/login');

  const rawTags = formData.get('tags');
  const tags = typeof rawTags === 'string'
    ? rawTags.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const parsed = ListingInput.safeParse({
    type:        formData.get('type'),
    title:       formData.get('title'),
    description: formData.get('description'),
    tags,
    location:    formData.get('location'),
  });
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(listings).values({
    userId: session.userId,
    email:  session.email,
    ...parsed.data,
  });

  revalidatePath('/');
  revalidatePath('/meine');
  redirect('/');
}

export async function deleteListing(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect('/login');

  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) return;

  await db
    .delete(listings)
    .where(and(eq(listings.id, id.data), eq(listings.userId, session.userId)));

  revalidatePath('/');
  revalidatePath('/meine');
}
```

The `WHERE id = ? AND user_id = ?` predicate is the authoritative
authorisation check. Other users' listings are silently unaffected by
a forged `id`.

### Step 26. Middleware

Create `src/middleware.ts`. The matcher gates every authenticated
route. The bare `/` is included because the marketplace page lives
there.

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session';

export async function middleware(req: NextRequest) {
  const jwt = req.cookies.get(COOKIE)?.value ?? req.cookies.get('session')?.value;
  if (!jwt) return NextResponse.redirect(new URL('/login', req.url));
  try {
    await jwtVerify(jwt, SECRET, { clockTolerance: 30 });
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE);
    return res;
  }
}

export const config = {
  matcher: ['/', '/new', '/meine/:path*'],
};
```

Middleware runs on the Edge runtime and reads `process.env` directly
(it cannot import `server-only` modules). `next build` already
validated the env via `lib/env.ts`, so by deploy time these values
are known good.

### Step 27. Root layout and i18n provider

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import I18nProvider from '@/i18n/Provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reutlingen University Connect',
  description: 'Hochschulinterne Vermittlungsplattform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#f5f5f5' }}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
```

The body background `#f5f5f5` matches the design's outermost div.

### Step 28. Auth-group pages

Create `src/app/(auth)/login/page.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ERRORS: Record<string, string> = {
  invalid_email: 'Bitte eine gültige E-Mail-Adresse eingeben.',
  forbidden_domain: 'Nur Hochschul-E-Mail-Adressen sind zugelassen.',
  too_many_requests: 'Zu viele Anfragen. Bitte später erneut versuchen.',
  unknown: 'Es ist ein Fehler aufgetreten. Bitte erneut versuchen.',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/auth/send-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (res.ok) { router.push('/check-email'); return; }
    const body = await res.json().catch(() => ({}));
    setError(ERRORS[body.error] ?? ERRORS.unknown);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <form onSubmit={submit} noValidate
        className="w-full max-w-md p-6 rounded-2xl"
        style={{ background: 'white', border: '2px solid black' }}>
        <h1 className="mb-4" style={{ fontWeight: 700, fontSize: '20px' }}>
          Anmeldung
        </h1>
        <label htmlFor="email" className="block mb-2" style={{ fontWeight: 500 }}>
          Hochschul-E-Mail
        </label>
        <input
          id="email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl mb-4"
          style={{ background: 'white', border: '2px solid black', fontSize: '15px' }}
        />
        <button type="submit" disabled={busy}
          className="w-full py-3 rounded-xl"
          style={{ background: 'black', color: 'white', fontWeight: 600 }}>
          {busy ? 'Wird gesendet…' : 'Anmeldelink anfordern'}
        </button>
        {error && <p role="alert" className="mt-3" style={{ color: 'black' }}>{error}</p>}
      </form>
    </main>
  );
}
```

Create `src/app/(auth)/check-email/page.tsx`:

```tsx
export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="max-w-md p-6 rounded-2xl text-center"
        style={{ background: 'white', border: '2px solid black' }}>
        <h1 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>
          E-Mail prüfen
        </h1>
        <p>Wir haben Ihnen einen Anmeldelink geschickt. Er ist 15 Minuten gültig.</p>
      </div>
    </main>
  );
}
```

### Step 29. Platform layout

Create `src/app/(platform)/layout.tsx`. Unlike the original BUILD.MD,
the layout has no header chrome of its own — the marketplace `Header`
component owns that. The layout just guards the boundary and provides
the footer.

```tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Footer from '@/components/layout/Footer';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f5f5f5' }}>
      {children}
      <Footer />
    </div>
  );
}
```

### Step 30. Main marketplace page

Create `src/app/(platform)/page.tsx`. The server component fetches up
to 500 rows, maps them to the `Listing` shape that
`Marketplace.tsx` consumes, and hands the array down. All filtering,
mode toggling, and pagination then runs client-side, exactly as in the
Figma reference.

```tsx
import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import type { Listing } from '@/types';
import Marketplace from '@/components/Marketplace';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const rows = await db
    .select()
    .from(listings)
    .orderBy(desc(listings.createdAt))
    .limit(500);

  const data: Listing[] = rows.map((r) => ({
    id:          r.id,
    type:        r.type,
    title:       r.title,
    description: r.description,
    tags:        r.tags,
    location:    r.location,
    email:       r.email,
  }));

  return <Marketplace listings={data} />;
}
```

The hard cap of 500 keeps payload size predictable until server-side
pagination is added; at that point the page can switch to passing a
`searchParams`-driven slice and the marketplace component can either
keep its current behaviour for in-page filtering or be reduced to
purely presentational props.

### Step 31. New-listing page

Create `src/app/(platform)/new/page.tsx`:

```tsx
'use client';
import { useActionState } from 'react';
import { useTranslation } from 'react-i18next';
import { createListing, type CreateState } from '@/actions/listings';

export default function NewListingPage() {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState<CreateState | null, FormData>(
    createListing, null,
  );

  return (
    <main className="max-w-[800px] mx-auto px-5 py-8">
      <form action={action} className="flex flex-col gap-4 p-6 rounded-2xl"
        style={{ background: 'white', border: '2px solid black' }}>
        <fieldset>
          <legend style={{ fontWeight: 600, marginBottom: '8px' }}>Typ</legend>
          <label className="mr-4">
            <input type="radio" name="type" value="need" defaultChecked /> {t('mode_need')}
          </label>
          <label>
            <input type="radio" name="type" value="offer" /> {t('mode_offer')}
          </label>
        </fieldset>

        <label>
          <span style={{ fontWeight: 500 }}>Titel</span>
          <input name="title" required maxLength={120}
            className="w-full px-4 py-2 rounded-xl mt-1"
            style={{ border: '2px solid black' }} />
        </label>

        <label>
          <span style={{ fontWeight: 500 }}>Beschreibung</span>
          <textarea name="description" required maxLength={2000} rows={5}
            className="w-full px-4 py-2 rounded-xl mt-1"
            style={{ border: '2px solid black' }} />
        </label>

        <label>
          <span style={{ fontWeight: 500 }}>Tags (kommagetrennt)</span>
          <input name="tags" placeholder="z. B. Familie, Mobilität"
            className="w-full px-4 py-2 rounded-xl mt-1"
            style={{ border: '2px solid black' }} />
        </label>

        <label>
          <span style={{ fontWeight: 500 }}>Standort</span>
          <input name="location" required maxLength={80}
            className="w-full px-4 py-2 rounded-xl mt-1"
            style={{ border: '2px solid black' }} />
        </label>

        {state && !state.ok && (
          <ul role="alert" style={{ color: 'black' }}>
            {Object.entries(state.errors).flatMap(([k, vs]) =>
              vs.map((v, i) => <li key={`${k}-${i}`}>{k}: {v}</li>)
            )}
          </ul>
        )}

        <button type="submit" disabled={pending}
          className="py-3 rounded-xl"
          style={{ background: 'black', color: 'white', fontWeight: 600 }}>
          Speichern
        </button>
      </form>
    </main>
  );
}
```

### Step 32. Manage-own-listings page

Create `src/app/(platform)/meine/page.tsx`. The page reuses
`ListingCard` with the `ownerActions` slot to attach a delete form.
The visual top of the card is unchanged from the design.

```tsx
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { getSession } from '@/lib/session';
import type { Listing } from '@/types';
import ListingCard from '@/components/marketplace/ListingCard';
import { deleteListing } from '@/actions/listings';
import { logout } from '@/actions/auth';

export const dynamic = 'force-dynamic';

export default async function MeinePage() {
  const session = (await getSession())!; // middleware guarantees presence

  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.userId, session.userId))
    .orderBy(desc(listings.createdAt));

  const data: Listing[] = rows.map((r) => ({
    id: r.id, type: r.type, title: r.title, description: r.description,
    tags: r.tags, location: r.location, email: r.email,
  }));

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '24px' }}>Meine Einträge</h1>
          <p style={{ fontWeight: 500 }}>{session.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="py-2 px-4 rounded-xl"
            style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}>
            Marktplatz
          </Link>
          <Link href="/new" className="py-2 px-4 rounded-xl"
            style={{ background: 'black', color: 'white', fontWeight: 600 }}>
            Neuer Eintrag
          </Link>
          <form action={logout}>
            <button type="submit" className="py-2 px-4 rounded-xl"
              style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}>
              Abmelden
            </button>
          </form>
        </div>
      </header>

      {data.length === 0 ? (
        <p>Sie haben noch keine Einträge.</p>
      ) : (
        <div className="space-y-4">
          {data.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              ownerActions={
                <form action={deleteListing}>
                  <input type="hidden" name="id" value={listing.id} />
                  <button type="submit" className="py-2 px-4 rounded-xl"
                    style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}>
                    Löschen
                  </button>
                </form>
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
```

### Step 33. Healthcheck endpoint

Create `src/app/api/healthz/route.ts`:

```ts
export const runtime = 'edge';

export async function GET() {
  return Response.json(
    { status: 'ok' },
    { headers: { 'cache-control': 'no-store' } },
  );
}
```

### Checkpoint

The full happy path now works locally:

1. `GET /` is gated by middleware, redirects to `/login`.
2. The login form posts to `/api/auth/send-link`.
3. The email arrives; clicking the link sets a session cookie and
   redirects back to `/`.
4. The marketplace page renders with the Figma layout: header with
   search and language button, mode toggle, category tabs, listing
   cards.
5. `/new` creates a listing; the user lands back on `/`.
6. `/meine` lists the user's own entries with delete buttons and a
   logout form.

---

## Phase 5: Deployment

### Step 34. Build script

Edit `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "vercel-build": "drizzle-kit migrate && next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

Failure modes worth understanding:

- *Schema-ahead-of-code window.* If a migration succeeds but
  `next build` fails, the database has the new schema while the
  previous application code is still serving. Mitigate by writing
  every migration as backwards-compatible.
- *Concurrent deploys.* Vercel queues deployments per branch.
  Drizzle's `__drizzle_migrations` table prevents double-apply.

### Step 35. Push to GitHub

```bash
git init
git add .
git commit -m "Initial implementation"
git branch -M main
git remote add origin git@github.com:<org>/dienstleistungs-exchange.git
git push -u origin main
```

### Step 36. Import the project into Vercel

In the Vercel dashboard: *Add New → Project → Import Git Repository*.
Add every variable from `.env.example` under
*Project Settings → Environment Variables* for all three scopes
(Production, Preview, Development). Use a separate Neon branch for
the Preview scope so pull requests do not write production data.

`NEXT_PUBLIC_BASE_URL` must point at the production domain in the
Production scope and at the preview URL pattern in the Preview scope.

### Step 37. First deployment

Pushing to `main` triggers a production build. Watch the build log:

- environment validation reports no errors
- `drizzle-kit migrate` reports the expected migrations as applied
- `next build` completes
- the response of any production request carries the security
  headers from `next.config.ts`

After deployment, log in once with a real university address and
confirm:

- the magic-link email arrives from the configured Brevo domain
- clicking the link sets a `__Host-session` cookie on the production
  domain
- creating, listing, and deleting an entry all work
- `GET /api/healthz` returns 200

### Step 38. Custom domain (optional)

Under *Project Settings → Domains*, add the production domain (e.g.,
`dienstleistungen.reutlingen-university.de`).

### Step 39. Future design refreshes

When the designer ships an updated `Waymakrdesignfigma-main.zip`:

1. Diff the design package's `src/app/components/` against
   `src/components/` in the application.
2. For each changed file, copy the new content over the existing
   one. Re-apply the two adjustments documented in Step 22 and
   Step 23 (alias imports and the institution-domain
   substitution in `DisclaimerOverlay`).
3. If the design changes a prop signature, the corresponding
   server-side caller (`Marketplace.tsx`, `meine/page.tsx`,
   `new/page.tsx`) flags the type error at `npm run typecheck`. The
   wrapper, not the component, is the place to absorb the change.

The boundary between "things the designer owns" and "things the
backend owns" is the file list in
[Component architecture](#component-architecture).

---

## API reference

All endpoints expect and return JSON unless noted otherwise.

### `POST /api/auth/send-link`

| Aspect          | Value                                                |
|-----------------|------------------------------------------------------|
| Auth            | None                                                 |
| Content-Type    | `application/json` (other types rejected with 415)   |
| Idempotency     | Each call invalidates prior unconsumed tokens for the email and issues a fresh one. Repeated calls are rate-limited. |
| Rate limit      | `RATE_LIMIT_SEND_LINK_PER_IP` per IP per hour, `RATE_LIMIT_SEND_LINK_PER_EMAIL` per email per hour |

Request: `{ "email": "<address>@reutlingen-university.de" }`

Responses: `202 { ok: true }`, `400 invalid_email|invalid_json`,
`403 forbidden_domain`, `415 unsupported_media_type`,
`429 too_many_requests` (with `Retry-After` header).

### `GET /verify?token=<raw>`

| Aspect       | Value                                                       |
|--------------|-------------------------------------------------------------|
| Auth         | None (the token is the credential)                          |
| Idempotency  | Single-use. Atomic `UPDATE … RETURNING` ensures only the first matching request succeeds. |

302 redirect targets:

- `/` (sets `__Host-session` cookie on success)
- `/login?e=missing` (no token or token too long)
- `/login?e=invalid` (not found, expired, or consumed)

### Server Action: `logout`

Destroys the session and redirects to `/login`. CSRF-protected by
Next.js's Origin check on Server Actions.

### Server Action: `createListing`

| Aspect       | Value                                                      |
|--------------|------------------------------------------------------------|
| Auth         | Required; redirects to `/login` if absent                  |
| Validation   | `type` ∈ {need, offer}; `title` 3–120; `description` 10–2000; `tags` ≤ 8 strings (1–40 each); `location` 1–80 |
| Returns      | `{ ok: true }` then redirects to `/`; `{ ok: false, errors }` on validation failure |

### Server Action: `deleteListing`

| Aspect          | Value                                                   |
|-----------------|---------------------------------------------------------|
| Auth            | Required                                                |
| Authorisation   | `WHERE id = ? AND user_id = ?`. Forged ids are silent no-ops. |
| Validation      | `id` must be a UUID; otherwise the action is a no-op    |

### `GET /api/healthz`

Edge runtime, no DB roundtrip, returns `{ "status": "ok" }` with
`Cache-Control: no-store`.

---

## Component architecture

The directory layout under `src/components/` is identical to the
Figma package's component layout under
`Waymakrdesignfigma-main/src/app/components/`:

```
src/
  types.ts                       — Listing, Mode, Category
  constants.ts                   — INSTITUTION_NAME, SUBTITLE, CARD_SHADOW
  data/
    icons.tsx                    — tag → icon map (designer-owned data)
  i18n/
    translations.ts              — five language bundles (designer-owned)
    index.ts                     — i18next init
    Provider.tsx                 — client provider used by RootLayout
  components/
    layout/
      Header.tsx                 — props: { searchQuery, onSearchChange }
      Footer.tsx                 — props: none
      LanguageButton.tsx         — props: none
    marketplace/
      ModeToggle.tsx             — props: { mode, onChange }
      CategoryTab.tsx            — props: { isSelected, onClick, isFirst, isLast, fullWidth?, children }
      CategoryTabs.tsx           — props: { categories, selectedCategory, onSelectCategory }
      ListingCard.tsx            — props: { listing, ownerActions? }
      PaginationControls.tsx     — props: { currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange }
      DisclaimerOverlay.tsx      — props: { onClose }
    Marketplace.tsx              — state owner; props: { listings }
```

### Drag-and-drop philosophy

Two boundaries are kept clean to make design refreshes safe:

1. **Designer-owned files.** Every file under `components/layout/`,
   `components/marketplace/`, `data/`, `i18n/`, plus `types.ts` and
   `constants.ts`, is treated as overwritable from the design
   package. The application never imports backend modules from these
   files; they only import each other and standard libraries.

2. **Wrapper-owned state and data.** Everything that talks to the
   database — Server Actions, server pages, middleware — lives
   outside the designer-owned set. The hand-off happens at one place:
   `Marketplace.tsx` accepts `listings: Listing[]`; pages produce
   that array.

Concretely:

- A new `ListingCard.tsx` shipped by the designer can be dropped in
  whole. The optional `ownerActions` slot used by `/meine` is the
  only thing the application code expects beyond the design's prop
  contract; if a future card drops the slot, `meine/page.tsx` either
  stops rendering it or moves the delete button elsewhere.
- A new `Header.tsx` can be dropped in. As long as it still accepts
  `searchQuery` and `onSearchChange`, no other change is needed.
- A new translation bundle (sixth language) is one entry in
  `i18n/translations.ts` and one entry in the `LANGUAGES` array.
- A new tag icon is one line in `data/icons.tsx`.

If a design change *does* break a prop contract, `tsc` flags it at
`npm run typecheck`, and the fix happens in the wrapper — never by
mutating the designer-owned file in place.

---

## Security notes

### Threat model summary

| Threat                                          | Mechanism                                     |
|-------------------------------------------------|-----------------------------------------------|
| Credential theft via DB leak                    | Tokens stored as SHA-256 hashes only          |
| Magic-link replay                               | Single-use tokens; prior tokens invalidated on new request |
| Concurrent token use (TOCTOU)                   | Atomic `UPDATE … RETURNING` with consume + expiry guard |
| Email-flood abuse of send-link                  | Per-IP and per-email rate limits in Postgres  |
| CSRF on state-changing endpoints                | Server Actions check Origin; JSON endpoints reject form-encoded bodies |
| Subdomain cookie injection                      | `__Host-` cookie prefix in production         |
| Session hijacking via XSS                       | `httpOnly` cookies + restrictive CSP          |
| Clickjacking                                    | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` |
| TLS downgrade                                   | HSTS with `includeSubDomains; preload`        |
| Response sniffing                               | `X-Content-Type-Options: nosniff`             |
| Open redirect                                   | Verify route uses `new URL('/path', req.url)` only; no untrusted redirect targets |
| Server-side state leakage to client bundle      | `import 'server-only'` in every secret-handling module |
| Cross-tenant listing access                     | Marketplace is gated by middleware; cards visible only to authenticated members of the configured email domain |

### Email visibility model

Every page that renders a listing's email address sits inside the
`(platform)` route group and is gated by `src/middleware.ts`. A viewer
who reaches such a page has presented a valid session JWT, which
proves ownership of an `@reutlingen-university.de` mailbox. The
inserent's email is therefore disclosed only to fellow members of the
same closed community — equivalent to a printed bulletin board on
campus. The disclaimer overlay states this guarantee in five
languages.

### Cookie strategy

Production uses a `__Host-session` cookie. The prefix is a
browser-enforced commitment device: the cookie is only accepted if
`Secure`, `Path=/`, and no `Domain` attribute are set, blocking any
subdomain from setting a session cookie that this app would honour.
In development (`http://`) the prefix would block storage entirely,
so the unprefixed name is used. Both names are read on every request
to avoid logout-on-deploy.

### CSP hardening path

The MVP CSP allows `'unsafe-inline'` for scripts because Next.js
inlines hydration data. The hardening path:

1. Add a nonce middleware that generates a per-request nonce and
   injects it into the response header and the relevant `<script>`
   tags. Replace `'unsafe-inline'` with `'nonce-...'` and
   `'strict-dynamic'`.
2. Tighten `style-src` similarly. The Figma components use inline
   `style={{...}}` props, which CSP treats as inline styles; the
   nonce-based approach handles them consistently with scripts.
3. Add `report-uri` / `report-to` and observe violations on the
   staging environment before promoting.

### Rate-limit choices

The chosen backing store is the `rate_limits` Postgres table.
Trade-off:

- *Pro:* zero new dependencies, no new vendor relationship, free in
  Neon's existing tier, schema travels with the rest of the migration
  history, easy to JOIN against `listings` for incident response.
- *Con:* one extra row insert and one count query per send-link
  request. Both hit the `(key, created_at)` index. At expected
  traffic this is negligible.

### Where to go from here

Iterations after the secured MVP, in priority order:

1. Pagination and search executed server-side (the marketplace
   currently filters in the browser over a 500-row cap).
2. CSP nonce middleware to remove `'unsafe-inline'`.
3. Logging and a basic admin view for the project owner.
4. Accessibility review (`Marketplace`'s search input lacks an
   associated label; the input/select cluster in `Header.tsx` can
   benefit from `aria-describedby` linking to the disclaimer).
5. Server-side i18n for the `<html lang>` attribute and OG
   metadata. The MVP renders `<html lang="en">` regardless of the
   language switcher state.
