# Dienstleistungs-Exchange

Internal university platform for students and staff of Reutlingen
University. Users post offers and requests for services and goods. The
poster's university email address is shown directly on each listing
card; further communication takes place off-platform. Access to all
content is restricted to authenticated members of the university.

Figma:

https://www.figma.com/make/vaEARPyhfvFIfzMZo79NDR/Mobile-Landing-Page-Design--Copy-?t=Um2UIN1WmiPhP7VK-1

## Contents

1. [Requirements](#requirements)
2. [Tech stack](#tech-stack)
3. [Repository layout](#repository-layout)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Database](#database)
7. [Authentication](#authentication)
8. [Data model](#data-model)
9. [Data protection](#data-protection)
10. [Deployment](#deployment)
11. [Roadmap](#roadmap)
12. [License](#license)
13. [Author](#author)

## Requirements

- Node.js 20 LTS (the 20 line is pinned in `package.json` `engines`; 21+ is unsupported)
- A Neon PostgreSQL project (EU region, Frankfurt)
- A Resend API key for sending magic-link emails
- A Vercel account for production hosting

## Tech stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 16 (App Router)             |
| Language    | TypeScript                          |
| Database    | PostgreSQL on Neon                  |
| DB driver   | `@neondatabase/serverless` (HTTP)   |
| ORM         | Drizzle ORM with Drizzle Kit        |
| Auth        | Custom magic link with JWT session  |
| Email       | Resend                              |
| Validation  | Zod                                 |
| Styling     | Tailwind CSS 4                      |
| Icons       | lucide-react                        |
| i18n        | i18next + react-i18next (EN/DE/FR/TR/ES) |
| Hosting     | Vercel                              |

Auth.js (formerly NextAuth) was evaluated but not adopted. Its built-in
email provider requires a database adapter that introduces user, account,
session, and verification-token tables. The custom flow described below
avoids those tables and keeps the schema close to the project requirement
of minimal data retention.

## Repository layout

    src/
      app/                       App Router
        (auth)/                  login, email confirmation, token verification
        (platform)/              auth-gated pages: marketplace (/), /new, /meine
        api/                     route handlers (send-link, healthz)
        layout.tsx               root layout with i18n provider
      actions/                   server actions: auth.ts (logout), listings.ts
      components/                designer-owned UI (mirrors Figma package layout)
        layout/                  Header, Footer, LanguageButton
        marketplace/             ModeToggle, CategoryTab(s), ListingCard,
                                 PaginationControls, DisclaimerOverlay
        Marketplace.tsx          state-owning client wrapper
      data/icons.tsx             tag → icon map (designer-owned)
      i18n/                      translations.ts, init, client provider
      db/                        Drizzle client and schema
      lib/                       env, auth, session, email, validators, rate-limit
      types.ts                   Listing, Mode, Category (mirrors Figma types)
      constants.ts               INSTITUTION_NAME, SUBTITLE, CARD_SHADOW
      middleware.ts              route gate for the (platform) group
    drizzle/                     generated SQL migrations
    public/                      static assets
    drizzle.config.ts
    next.config.ts
    package.json
    tsconfig.json

The component layout under `src/components/` (and the supporting
`data/`, `i18n/`, `types.ts`, `constants.ts` files at the `src/` root)
deliberately mirror the Figma reference package one-to-one. The intent
is that any future design refresh can be applied as a file-level
overwrite rather than a manual port. See *Component architecture* in
`BUILD.MD` for the full prop contracts and the drag-and-drop
philosophy.

The application is organised in four areas.

**Routing.** All routes live under `src/app/` and follow the Next.js
App Router conventions. Two route groups separate concerns: `(auth)`
covers the unauthenticated pages (login form, email-sent screen, token
verification endpoint), and `(platform)` covers the authenticated
pages — the marketplace at `/`, listing creation at `/new`, and
own-listings management at `/meine`. Route handlers under
`src/app/api/` expose the magic-link issuing endpoint and a liveness
probe; logout is implemented as a Server Action so that Next.js
provides Origin-based CSRF protection automatically.

**Persistence.** `src/db/schema.ts` defines a single `listings` table
(with a `listing_type` enum column distinguishing `'need'` and
`'offer'`) plus the internal `magic_tokens` and `rate_limits` tables.
The row shape matches the Figma `Listing` type exactly so that
designer-owned components consume database rows without a mapping
layer. `src/db/client.ts` initialises the Drizzle client against the
Neon HTTP driver. Generated SQL migrations are written to `drizzle/`
at the repository root by Drizzle Kit.

**Server logic.** Mutations are implemented as Server Actions under
`src/actions/`, one file per concern: `auth.ts` for logout and
`listings.ts` for create/delete. Cross-cutting helpers are collected
in `src/lib/`:
validated environment access (`env.ts`), token hashing (`auth.ts`),
session cookies (`session.ts`), the Resend client (`email.ts`), shared
Zod schemas (`validators.ts`), and the Postgres-backed rate limiter
(`rate-limit.ts`). Every helper that reads secrets or touches the
database imports `'server-only'` so that the Next.js bundler refuses
to include it in any client bundle.

**UI and access control.** Reusable components are in
`src/components/`. Route protection is handled centrally in
`src/middleware.ts`, which redirects unauthenticated requests to the
`(platform)` group back to `/login`.

## Installation

```bash
git clone https://github.com/<org>/dienstleistungs-exchange.git
cd dienstleistungs-exchange
npm install
```

## Configuration

Copy `.env.example` to `.env.local` and provide values for the variables
listed below.

```env
# Database (Neon, Frankfurt region)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Auth
AUTH_SECRET="..."                         # 32 random bytes, used to sign tokens and sessions
MAGIC_LINK_TTL_MINUTES=15
SESSION_TTL_DAYS=30

# Email
RESEND_API_KEY="re_..."
EMAIL_FROM="Dienstleistungs-Exchange <noreply@reutlingen-university.de>"

# Application
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_INSTITUTION_DOMAIN="reutlingen-university.de"  # must equal ALLOWED_EMAIL_DOMAIN
ALLOWED_EMAIL_DOMAIN="reutlingen-university.de"

# Rate limits (per hour, per dimension)
RATE_LIMIT_SEND_LINK_PER_IP=10
RATE_LIMIT_SEND_LINK_PER_EMAIL=5
```

## Database

The schema lives in `src/db/schema.ts`. Migrations are managed by Drizzle Kit.

```bash
# Generate a SQL migration from the current schema
npx drizzle-kit generate

# Apply pending migrations against DATABASE_URL
npx drizzle-kit migrate

# For early development only: push the schema directly without a migration file
npx drizzle-kit push
```

To start the development server:

```bash
npm run dev
```

The application is then available at `http://localhost:3000`.

## Authentication

Authentication uses a custom magic-link flow. No passwords are stored, and
the schema does not contain a user table.

1. The user enters their address on `/login`.
2. The server validates that the address belongs to
   `reutlingen-university.de` — either the apex domain itself or any
   subdomain of it (`student.reutlingen-university.de`,
   `lb.reutlingen-university.de`, etc.). Look-alike domains such as
   `evil-reutlingen-university.de` or
   `reutlingen-university.de.attacker.com` are rejected because the
   check requires a literal `.` separator before the configured base.
3. A random token is generated. Its SHA-256 hash is written to the
   `magic_tokens` table together with the address and a 15-minute expiry.
   The token itself is sent to the address as part of a verification URL.
4. On `/verify?token=...` the server hashes the supplied token and runs
   a single atomic `UPDATE … RETURNING` that simultaneously checks the
   hash, asserts that the row is unconsumed, asserts that it has not
   expired, and marks it as consumed. The atomic statement closes the
   read-then-write window that would otherwise allow two concurrent
   clicks on the same link to both succeed.
5. On success, a signed JWT is written to an HTTP-only, Secure,
   `SameSite=Lax` cookie. In production the cookie is named
   `__Host-session`, which the browser only accepts when `Secure`,
   `Path=/`, and no `Domain` attribute are set. The JWT carries the
   user identifier and the email address.
6. Subsequent requests resolve the session through the helper
   `getSession()`, which verifies and decodes the cookie.

The `POST /api/auth/send-link` endpoint is rate-limited per IP and per
email address; counters are stored in a `rate_limits` table in the
same Postgres database. Each new request also invalidates any previously
issued unconsumed token for the same address, so an old link cannot be
used after a new one has been requested.

The user identifier is derived deterministically from the address as
`sha256(email)`. The same person therefore receives a stable identifier
across sessions without a user record being persisted.

## Data model

One business table holds every listing — both *Suche* (need) and
*Biete* (offer) entries — distinguished by an enum column. Two
internal tables hold hashed magic-link tokens and rate-limit counters.

```ts
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const listingType = pgEnum('listing_type', ['need', 'offer']);

export const listings = pgTable('listings', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),                    // sha256(email)
  email:       text('email').notNull(),                      // visible to authenticated viewers
  type:        listingType('type').notNull(),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  tags:        text('tags').array().notNull().default([]),
  location:    text('location').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const magicTokens = pgTable('magic_tokens', {
  tokenHash:   text('token_hash').primaryKey(),
  email:       text('email').notNull(),
  expiresAt:   timestamp('expires_at', { withTimezone: true }).notNull(),
  consumed:    boolean('consumed').default(false).notNull(),
});

export const rateLimits = pgTable('rate_limits', {
  id:        uuid('id').primaryKey().defaultRandom(),
  key:       text('key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

The `listings` row shape is identical to the Figma `Listing`
TypeScript interface (`id`, `userId`, `email`, `type`, `title`,
`description`, `tags`, `location`, `createdAt`). Categories on the
marketplace are derived client-side from the `tags` array of the
currently displayed listings, ranked by frequency.

`rate_limits` records each rate-limited request as a row keyed by
`send-link:ip:<ip>` or `send-link:email:<email>`. A short cleanup
runs at the start of every send-link request to keep the table bounded.

The schema does not include profile pictures, age, gender, telephone
numbers, or any other personal attribute beyond the address required for
contacting the inserent.

## Data protection

The following properties are relevant for the GDPR review.

- No user table. Identity is the email address; the stored identifier is
  its SHA-256 hash.
- Session state is held in a signed cookie, not in the database.
- Magic-link tokens are stored only as hashes, expire after 15 minutes,
  and are single-use.
- The marketplace and every other listing-rendering page live behind
  authentication via `src/middleware.ts`. The inserent's address is
  visible directly on each listing card. Because every viewer is an
  authenticated member of the same university, the address is treated
  as visible to a closed community rather than to the public web; the
  in-app *Disclaimer* overlay states this guarantee in five languages.
- No file uploads, no chat, no message history.
- The database is hosted in the EU (Neon, Frankfurt, `eu-central-1`).
- External hosting on Vercel was confirmed in advance with the
  Rechenzentrum.
- Users can delete their own listings at any time. Logout clears the
  session cookie.
- Only standard PostgreSQL features are used. A later migration of the
  database to university-operated infrastructure is therefore feasible.

## Deployment

Production hosting is on Vercel. The database remains on Neon in the
Frankfurt region. Resend handles outbound email.

### Initial setup

1. Push the repository to GitHub.
2. Create a new project on Vercel and import the repository. Vercel
   detects Next.js automatically and applies the correct build settings.
3. Add the variables from `.env.example` under
   *Project Settings → Environment Variables*. Each variable must be set
   for all three scopes used by Vercel: *Production*, *Preview*, and
   *Development*. For preview deployments a separate Neon branch is
   recommended so that pull requests do not write to production data.
4. Connect a custom domain if required (for example,
   `dienstleistungen.reutlingen-university.de`) under
   *Project Settings → Domains*.

### Branching workflow

| Branch / event             | Vercel deployment            | Database          |
|----------------------------|------------------------------|-------------------|
| Push to `main`             | Production                   | Neon main branch  |
| Pull request to `main`     | Preview (unique URL per PR)  | Neon preview branch |
| Local `npm run dev`        | not deployed                 | Local Neon branch or development branch |

Every push to `main` triggers a production build. Every pull request
receives its own preview URL, which is posted as a comment on the PR by
the Vercel GitHub integration. The preview can be reviewed by IT or the
project owner before the PR is merged.

### Build and migrations

Database migrations are applied during the Vercel build through a
dedicated script in `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "drizzle-kit migrate && next build"
  }
}
```

Vercel runs `vercel-build` if it is defined, falling back to `build`
otherwise. The migration step uses `DATABASE_URL` from the active
environment scope, so production deploys migrate the production database
and preview deploys migrate the preview branch. Local migrations against
the production database are not part of the workflow.

### Rollback

Vercel keeps every previous deployment. A faulty release can be reverted
from the *Deployments* tab by promoting the previous successful build to
production. Database migrations are forward-only; a schema rollback
requires an additional migration that reverses the change.

### Manual deployment

For a one-off deployment without going through Git, the Vercel CLI can be
used:

```bash
npm install -g vercel
vercel              # preview deployment
vercel --prod       # production deployment
```

This is intended for emergency fixes only. The Git workflow above is the
primary path.

## Roadmap

- [x] Technical concept and data model
- [x] Figma reference design integrated into the component layout
- [ ] Project scaffold (Next.js, TypeScript, App Router, `src/`)
- [ ] Drizzle schema (single `listings` table) and initial migration on Neon
- [ ] Magic-link authentication with JWT session and per-IP / per-email
      rate limiting
- [ ] CRUD for listings via Server Actions
- [ ] Auth-gated platform layout and middleware
- [ ] Marketplace page with mode toggle, tag-derived categories, search,
      and pagination (per Figma design)
- [ ] /meine page for managing own listings
- [ ] CSP nonce middleware (remove `'unsafe-inline'` from `script-src`)
- [ ] Server-side pagination and search
- [ ] Internal pilot
- [ ] Review for migration to university infrastructure

## License

To be defined.

## Author

Martin Lauterbach, Hochschule Reutlingen, April 2026.
