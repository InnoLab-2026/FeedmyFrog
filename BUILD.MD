# Build Guide

This document walks through building the Dienstleistungs-Exchange from an
empty directory to a deployable application. The guide is divided into
five phases. Each phase ends in a state that can be tested in isolation,
so it is safe to stop and resume.

## Contents

1. [Prerequisites](#1-prerequisites)
2. [Phase 1: Project bootstrap](#phase-1-project-bootstrap)
3. [Phase 2: Database and schema](#phase-2-database-and-schema)
4. [Phase 3: Authentication](#phase-3-authentication)
5. [Phase 4: Application features](#phase-4-application-features)
6. [Phase 5: Deployment](#phase-5-deployment)

## 1. Prerequisites

Before starting, prepare the following:

- Node.js 20 or later, and either npm, pnpm, or yarn
- A GitHub repository for the project
- A Neon account; create a project in the Frankfurt region
  (`eu-central-1`)
- A Resend account; create an API key and verify the sending domain
- A Vercel account linked to the same GitHub organisation

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
- Tailwind CSS: optional (the guide does not depend on it)
- `src/` directory: yes
- App Router: yes
- Turbopack for `next dev`: yes
- Custom import alias: no (keep `@/*`)

### Step 2. Install runtime dependencies

```bash
npm install drizzle-orm @neondatabase/serverless jose zod resend
```

- `drizzle-orm` and `@neondatabase/serverless`: ORM and HTTP driver for
  Neon.
- `jose`: JWT signing and verification. Works in both the Node and Edge
  runtimes, which Next.js middleware requires.
- `zod`: input validation in Server Actions.
- `resend`: client SDK for sending magic-link emails.

### Step 3. Install development dependencies

```bash
npm install -D drizzle-kit dotenv tsx
```

`drizzle-kit` generates and applies migrations. `tsx` is used for
running ad-hoc TypeScript scripts (for example a one-off seed script).

### Step 4. Initialise environment variables

Create a `.env.example` at the project root:

```env
DATABASE_URL=
AUTH_SECRET=
MAGIC_LINK_TTL_MINUTES=15
SESSION_TTL_DAYS=30
RESEND_API_KEY=
EMAIL_FROM="Dienstleistungs-Exchange <noreply@reutlingen-university.de>"
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAIN=reutlingen-university.de
```

Copy it to `.env.local` and fill in the real values. Generate
`AUTH_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add `.env.local` to `.gitignore` if the Next.js template has not
already done so.

### Checkpoint

Run `npm run dev` and confirm that the default Next.js page loads at
`http://localhost:3000`.

---

## Phase 2: Database and schema

### Step 5. Configure Drizzle

Create `drizzle.config.ts` at the project root:

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

### Step 6. Define the schema

Create `src/db/schema.ts`:

```ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const angebote = pgTable('angebote', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),
  email:       text('email').notNull(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const gesuche = pgTable('gesuche', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),
  email:       text('email').notNull(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const magicTokens = pgTable('magic_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  email:     text('email').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  consumed:  boolean('consumed').default(false).notNull(),
});
```

### Step 7. Create the Drizzle client

Create `src/db/client.ts`:

```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Step 8. Generate and apply the first migration

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

The first command creates a SQL file in `drizzle/`. The second applies
it against the Neon database referenced by `DATABASE_URL`.

### Checkpoint

Open the Neon console and confirm that the three tables (`angebote`,
`gesuche`, `magic_tokens`) exist in the `public` schema.

---

## Phase 3: Authentication

The flow is described in the main README. This phase implements it in
five files: a token helper, an email helper, a session helper, the
verification route, and the send-link API.

### Step 9. Token helpers

Create `src/lib/auth.ts`:

```ts
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function userIdFromEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}
```

### Step 10. Session helpers

Create `src/lib/session.ts`. This uses `jose` so the same code runs in
the Edge runtime used by middleware.

```ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export type Session = { userId: string; email: string };

export async function createSession(s: Session): Promise<void> {
  const days = Number(process.env.SESSION_TTL_DAYS ?? 30);
  const jwt = await new SignJWT(s)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<Session | null> {
  const jwt = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secret);
    return { userId: String(payload.userId), email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
```

In Next.js 15 the `cookies()` helper is asynchronous. Earlier examples
that call `cookies()` synchronously will not type-check.

### Step 11. Email helper

Create `src/lib/email.ts`:

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendMagicLink(email: string, url: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Anmeldelink für den Dienstleistungs-Exchange',
    text:
      `Hallo,\n\n` +
      `klicken Sie auf den folgenden Link, um sich anzumelden. ` +
      `Der Link ist 15 Minuten gültig und kann nur einmal verwendet werden.\n\n` +
      `${url}\n\n` +
      `Wenn Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.`,
  });
}
```

### Step 12. Send-link route

Create `src/app/api/auth/send-link/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { generateToken } from '@/lib/auth';
import { sendMagicLink } from '@/lib/email';

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const allowed = process.env.ALLOWED_EMAIL_DOMAIN!;
  if (!email.endsWith('@' + allowed)) {
    return NextResponse.json({ error: 'forbidden_domain' }, { status: 403 });
  }

  const ttl = Number(process.env.MAGIC_LINK_TTL_MINUTES ?? 15);
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  await db.insert(magicTokens).values({ tokenHash: hash, email, expiresAt });

  const url =
    `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${encodeURIComponent(raw)}`;
  await sendMagicLink(email, url);

  return NextResponse.json({ ok: true });
}
```

The raw token never reaches the database. Only its SHA-256 hash is
stored, so a database leak does not allow an attacker to forge a login.

### Step 13. Verification route

Create `src/app/(auth)/verify/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { hashToken, userIdFromEmail } from '@/lib/auth';
import { createSession } from '@/lib/session';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('token');
  if (!raw) return NextResponse.redirect(new URL('/login?e=missing', url));

  const hash = hashToken(raw);
  const [row] = await db
    .select()
    .from(magicTokens)
    .where(eq(magicTokens.tokenHash, hash))
    .limit(1);

  if (!row || row.consumed || row.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/login?e=invalid', url));
  }

  await db
    .update(magicTokens)
    .set({ consumed: true })
    .where(eq(magicTokens.tokenHash, hash));

  await createSession({
    userId: userIdFromEmail(row.email),
    email: row.email,
  });

  return NextResponse.redirect(new URL('/angebote', url));
}
```

### Step 14. Login and confirmation pages

Create `src/app/(auth)/login/page.tsx` with a simple client form that
posts to `/api/auth/send-link`. Create
`src/app/(auth)/check-email/page.tsx` as a static confirmation screen.

```tsx
// src/app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/auth/send-link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (res.ok) router.push('/check-email');
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Hochschul-E-Mail</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={busy}>
        {busy ? 'Wird gesendet…' : 'Anmeldelink anfordern'}
      </button>
    </form>
  );
}
```

### Checkpoint

Submit the login form with a valid university address. The email should
arrive within seconds. Clicking the link should redirect to `/angebote`
(which does not yet exist; a 404 here is expected). Inspect the browser
cookies and confirm that a `session` cookie has been set.

---

## Phase 4: Application features

### Step 15. Middleware

Create `src/middleware.ts` to gate the `(platform)` routes:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function middleware(req: NextRequest) {
  const jwt = req.cookies.get('session')?.value;
  if (!jwt) return NextResponse.redirect(new URL('/login', req.url));
  try {
    await jwtVerify(jwt, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/angebote/:path*', '/gesuche/:path*', '/meine'],
};
```

### Step 16. Auth-gated layout

Create `src/app/(platform)/layout.tsx`. This layout receives the
authenticated session and can render a header that displays the user's
email and a logout button.

```tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div>
      <header>
        <strong>Dienstleistungs-Exchange</strong>
        <span>{session.email}</span>
        <form action="/api/auth/logout" method="post">
          <button type="submit">Abmelden</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

### Step 17. Server Actions for Angebote

Create `src/actions/angebote.ts`:

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { angebote } from '@/db/schema';
import { getSession } from '@/lib/session';

const Input = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
});

export async function createAngebot(formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const parsed = Input.parse({
    title: formData.get('title'),
    description: formData.get('description'),
  });

  await db.insert(angebote).values({
    userId: session.userId,
    email: session.email,
    title: parsed.title,
    description: parsed.description,
  });

  revalidatePath('/angebote');
  redirect('/angebote');
}

export async function deleteAngebot(id: string) {
  const session = await getSession();
  if (!session) redirect('/login');

  await db
    .delete(angebote)
    .where(and(eq(angebote.id, id), eq(angebote.userId, session.userId)));

  revalidatePath('/angebote');
  revalidatePath('/meine');
}
```

The `userId` check in `delete` ensures that a user can only delete
their own listings.

Create `src/actions/gesuche.ts` along the same lines, replacing
`angebote` with `gesuche`.

### Step 18. Listing pages

Create `src/app/(platform)/angebote/page.tsx`:

```tsx
import { desc } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/db/client';
import { angebote } from '@/db/schema';

export default async function AngebotePage() {
  const rows = await db
    .select()
    .from(angebote)
    .orderBy(desc(angebote.createdAt));

  return (
    <section>
      <h1>Angebote</h1>
      <Link href="/angebote/new">Neues Angebot</Link>
      <ul>
        {rows.map((a) => (
          <li key={a.id}>
            <Link href={`/angebote/${a.id}`}>{a.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Create `src/app/(platform)/angebote/new/page.tsx`:

```tsx
import { createAngebot } from '@/actions/angebote';

export default function NewAngebotPage() {
  return (
    <form action={createAngebot}>
      <label htmlFor="title">Titel</label>
      <input id="title" name="title" required />
      <label htmlFor="description">Beschreibung</label>
      <textarea id="description" name="description" required />
      <button type="submit">Speichern</button>
    </form>
  );
}
```

For the detail page, remember that in Next.js 15 the `params` argument
is a Promise:

```tsx
// src/app/(platform)/angebote/[id]/page.tsx
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { angebote } from '@/db/schema';
import EmailReveal from '@/components/EmailReveal';

export default async function AngebotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(angebote)
    .where(eq(angebote.id, id))
    .limit(1);

  if (!row) notFound();

  return (
    <article>
      <h1>{row.title}</h1>
      <p>{row.description}</p>
      <EmailReveal email={row.email} />
    </article>
  );
}
```

Repeat the three pages (`page.tsx`, `new/page.tsx`, `[id]/page.tsx`)
for `gesuche`, and add `meine/page.tsx` that lists the current user's
own entries from both tables.

### Step 19. Email reveal component

The platform reveals the inserent's address only after a click. This is
a small client component:

```tsx
// src/components/EmailReveal.tsx
'use client';
import { useState } from 'react';

export default function EmailReveal({ email }: { email: string }) {
  const [shown, setShown] = useState(false);
  if (!shown) {
    return (
      <button type="button" onClick={() => setShown(true)}>
        Kontakt anzeigen
      </button>
    );
  }
  return <a href={`mailto:${email}`}>{email}</a>;
}
```

### Step 20. Logout route

Create `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/login', req.url));
}
```

### Checkpoint

The full happy path now works locally: log in, create an Angebot, view
it from another browser session, click *Kontakt anzeigen*, send an
email outside the platform.

---

## Phase 5: Deployment

### Step 21. Add the build script

Edit `package.json` and add a `vercel-build` script that runs
migrations before building:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "vercel-build": "drizzle-kit migrate && next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

Vercel uses `vercel-build` if it is defined and falls back to `build`
otherwise.

### Step 22. Push to GitHub

```bash
git init
git add .
git commit -m "Initial implementation"
git branch -M main
git remote add origin git@github.com:<org>/dienstleistungs-exchange.git
git push -u origin main
```

### Step 23. Import the project into Vercel

In the Vercel dashboard: *Add New → Project → Import Git Repository*
and select the repository. Vercel detects the Next.js framework
automatically.

Under *Project Settings → Environment Variables*, add every variable
from `.env.example` for all three scopes (Production, Preview,
Development). Use a separate Neon branch for the Preview scope so that
pull requests do not write to production data.

Set `NEXT_PUBLIC_BASE_URL` to the production domain (or the Vercel
preview URL pattern for the Preview scope).

### Step 24. Trigger the first deployment

Pushing to `main` triggers an automatic production build. Watch the
Vercel build log to confirm that `drizzle-kit migrate` runs before
`next build` and that no migrations fail.

After the deployment finishes, log in once with a real university
address to verify that:

- the magic-link email arrives from the configured Resend domain;
- clicking the link sets a session cookie on the production domain;
- creating and listing an Angebot works as expected.

### Step 25. Connect a custom domain (optional)

Under *Project Settings → Domains*, add the production domain (for
example `dienstleistungen.reutlingen-university.de`) and follow the DNS
instructions shown by Vercel.

---

## Where to go from here

The implementation above is the MVP outlined in the project concept.
Further iterations should add, in roughly this order:

1. Rate limiting on `POST /api/auth/send-link` to prevent abuse of the
   email-sending endpoint.
2. Pagination and search on the Angebote and Gesuche listings.
3. A scheduled job that deletes consumed and expired rows from
   `magic_tokens`.
4. Logging and a basic admin view for the project owner.
5. Accessibility review and German-language UX polish before the pilot.
