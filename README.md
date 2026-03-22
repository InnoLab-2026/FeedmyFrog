# Dienstleistungs-Exchange

Hochschulinterne Vermittlungsplattform für Studierende und Mitarbeitende der
Hochschule Reutlingen. Nutzer veröffentlichen Angebote und Gesuche für
Dienstleistungen und Güter. Bei Interesse wird die Hochschul-E-Mail-Adresse
des Inserenten angezeigt; die weitere Kommunikation findet außerhalb der
Plattform statt.

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

- Node.js 20 or later
- A Neon PostgreSQL project (EU region, Frankfurt)
- A Resend API key for sending magic-link emails
- A Vercel account for production hosting

## Tech stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 15 (App Router)             |
| Language    | TypeScript                          |
| Database    | PostgreSQL on Neon                  |
| DB driver   | `@neondatabase/serverless` (HTTP)   |
| ORM         | Drizzle ORM with Drizzle Kit        |
| Auth        | Custom magic link with JWT session  |
| Email       | Resend                              |
| Validation  | Zod                                 |
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
        (platform)/              auth-gated pages for offers and requests
        api/                     route handlers (send-link, logout, healthz)
      actions/                   server actions for create / update / delete
      components/                reusable UI
      db/                        Drizzle client and schema
      lib/                       auth, session, email, validation, rate limiting
      middleware.ts              route gate for the (platform) group
    drizzle/                     generated SQL migrations
    public/                      static assets
    drizzle.config.ts
    next.config.ts
    package.json
    tsconfig.json

The application is organised in four areas.

**Routing.** All routes live under `src/app/` and follow the Next.js
App Router conventions. Two route groups separate concerns: `(auth)`
covers the unauthenticated pages (login form, email-sent screen, token
verification endpoint), and `(platform)` covers the authenticated pages
for browsing, creating, and managing listings. Route handlers under
`src/app/api/` expose the magic-link issuing endpoint, the logout
endpoint, and a liveness probe.

**Persistence.** `src/db/schema.ts` defines the three tables
(`angebote`, `gesuche`, `magic_tokens`) and `src/db/client.ts`
initialises the Drizzle client against the Neon HTTP driver. Generated
SQL migrations are written to `drizzle/` at the repository root by
Drizzle Kit.

**Server logic.** Mutations are implemented as Server Actions under
`src/actions/`, one file per domain (`angebote.ts`, `gesuche.ts`).
Cross-cutting helpers are collected in `src/lib/`: token signing and
session cookies (`auth.ts`, `session.ts`), the Resend client
(`email.ts`), Zod schemas (`validators.ts`), and rate limiting for the
authentication endpoints (`rate-limit.ts`).

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
ALLOWED_EMAIL_DOMAIN="reutlingen-university.de"
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
2. The server validates that the address ends in
   `@reutlingen-university.de`.
3. A random token is generated. Its SHA-256 hash is written to the
   `magic_tokens` table together with the address and a 15-minute expiry.
   The token itself is sent to the address as part of a verification URL.
4. On `/verify?token=...` the server hashes the supplied token, looks it
   up in `magic_tokens`, and rejects requests where the entry is missing,
   expired, or already consumed. The lookup is performed in constant time.
5. On success, the row is marked as consumed. A signed JWT is written to
   an HTTP-only, Secure, `SameSite=Lax` cookie. The JWT carries the user
   identifier and the email address.
6. Subsequent requests resolve the session through the helper
   `getSession()`, which verifies and decodes the cookie.

The user identifier is derived deterministically from the address as
`sha256(email)`. The same person therefore receives a stable identifier
across sessions without a user record being persisted.

## Data model

Two business tables hold the listings. A third internal table stores the
hashed magic-link tokens during the validity window.

```ts
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const angebote = pgTable('angebote', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull(),       // sha256(email)
  email:       text('email').notNull(),         // shown when interest is expressed
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
  tokenHash:   text('token_hash').primaryKey(),
  email:       text('email').notNull(),
  expiresAt:   timestamp('expires_at').notNull(),
  consumed:    boolean('consumed').default(false).notNull(),
});
```

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
- [ ] Project scaffold (Next.js, TypeScript, App Router, `src/`)
- [ ] Drizzle schema and initial migration on Neon
- [ ] Magic-link authentication with JWT session
- [ ] CRUD for Angebote and Gesuche via Server Actions
- [ ] Auth-gated platform layout and middleware
- [ ] Listing browse, detail view, and email reveal
- [ ] Rate limiting on the authentication endpoints
- [ ] Internal pilot
- [ ] Review for migration to university infrastructure

## License

To be defined.

## Author

Martin Lauterbach, Hochschule Reutlingen, April 2026.
