# FeedmyFrog — Reutlingen University Connect

Internal university platform for students and staff of Reutlingen
University. Members post *Suche* (need) and *Biete* (offer) listings for
services and goods. The poster's university email address is shown
directly on each listing card; further communication takes place
off-platform by mail. Every page that renders listing data is behind
authentication, so the address is only ever visible to a closed
community of verified university members.

Three names appear in this repository and all three are correct:

| Name | Where it is used |
|------|------------------|
| `FeedmyFrog` | GitHub repository, production domain `feedmyfrog.click`, OTel service name |
| `Reutlingen University Connect` | product name shown to users — `APP_NAME` in `src/constants.ts` |
| `dienstleistungs-exchange` | npm package name in `package.json` |

Production: <https://feedmyfrog.click>

Figma reference design:
<https://www.figma.com/make/vaEARPyhfvFIfzMZo79NDR/Mobile-Landing-Page-Design--Copy-?t=Um2UIN1WmiPhP7VK-1>

## Contents

1. [Requirements](#requirements)
2. [Tech stack](#tech-stack)
3. [Architecture at a glance](#architecture-at-a-glance)
4. [Page map](#page-map)
5. [Repository layout](#repository-layout)
6. [Installation](#installation)
7. [Configuration](#configuration)
8. [Backend](#backend)
9. [Frontend](#frontend)
10. [Testing and quality gates](#testing-and-quality-gates)
11. [DevOps](#devops)
12. [Data protection](#data-protection)
13. [Roadmap](#roadmap)
14. [License](#license)
15. [Author](#author)

Two companion documents carry the detail this file summarises:
[`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) (measured latency work) and
[`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) (the SSR and EU data-law audit
record). [`BUILD.MD`](BUILD.MD) is the step-by-step build guide that
reconstructs the project from an empty directory.

## Requirements

- Node.js 24 (pinned in `package.json` `engines: ">=24 <25"` and `.nvmrc`; run `nvm use`)
- A Neon PostgreSQL project (EU region, Frankfurt / `eu-central-1`) on which
  the `pg_trgm` extension can be created — migration `0002` needs it
- A Brevo API key for sending magic-link emails, with `feedmyfrog.click`
  verified as a sender domain (DKIM published, DMARC configured)
- A Vercel account for production hosting

## Tech stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js, App Router | 16.2.12 |
| UI runtime | React / React DOM | 19.2.4 |
| Language | TypeScript, `strict: true` | 5.x |
| Database | PostgreSQL on Neon, Frankfurt | — |
| DB driver | `@neondatabase/serverless` over HTTP | 1.1.x |
| ORM | Drizzle ORM / Drizzle Kit | 0.45 / 0.31 |
| Auth | Custom magic link, HS256 JWT session via `jose` | 6.x |
| Email | Brevo transactional API (`api.brevo.com/v3/smtp/email`) | — |
| Validation | Zod | 4.x |
| Styling | Tailwind CSS 4 plus a CSS custom-property type scale | 4.x |
| Icons | `lucide-react` | 1.x |
| i18n | `i18next` / `react-i18next`, five languages | 26 / 17 |
| Tests | Vitest (unit/integration with `@electric-sql/pglite`), Cypress (E2E) | 4.x / 16.x |
| Tracing | `@vercel/otel` + `@opentelemetry/api`, `@vercel/speed-insights` | 2.x |
| Hosting | Vercel, functions pinned to `fra1` | — |

Auth.js (formerly NextAuth) was evaluated but not adopted. Its built-in
email provider requires a database adapter that introduces user, account,
session, and verification-token tables. The custom flow described below
avoids those tables and keeps the schema close to the project requirement
of minimal data retention.

## Architecture at a glance

```mermaid
flowchart LR
    subgraph Client["Browser"]
        UI["React 19 client components<br/>i18next, URL-driven filter state"]
    end

    subgraph Vercel["Vercel, region fra1"]
        PROXY["src/proxy.ts<br/>route gate + per-request CSP nonce"]
        RSC["Server Components<br/>(auth) pages, legal pages, 404"]
        RH["Route handlers<br/>/api/auth/send-link, /verify, /api/healthz"]
        SA["Server Actions<br/>createListing, updateListing,<br/>deleteListing, logout"]
        LIB["src/lib<br/>env, auth, session, email,<br/>validators, rate-limit, geo"]
    end

    subgraph External["Managed services"]
        NEON[("Neon PostgreSQL<br/>eu-central-1<br/>listings, magic_tokens, rate_limits")]
        BREVO["Brevo<br/>transactional email"]
        OTEL["Vercel Observability<br/>OTel spans + Speed Insights"]
    end

    UI -->|"HTTP"| PROXY
    PROXY --> RSC
    PROXY --> SA
    UI -->|"fetch / form POST"| RH
    RSC --> LIB
    RH --> LIB
    SA --> LIB
    LIB -->|"drizzle-orm/neon-http"| NEON
    LIB -->|"HTTPS"| BREVO
    RSC -.-> OTEL
    RH -.-> OTEL
```

Every request that renders HTML passes through `src/proxy.ts`, which does
two independent jobs: it gates the `(auth)` route group, and it mints the
per-request CSP nonce that the whole document is rendered under.

### Request pipeline and the three auth layers

Access control follows the defense-in-depth model recommended for the App
Router — a lesson of CVE-2025-29927, where middleware could be bypassed.
Three independent layers each verify the session.

```mermaid
flowchart TD
    REQ["Incoming request"] --> MATCH{"Matches the proxy matcher?<br/>excludes /api, /_next/static, /_next/image,<br/>favicon, svg/png/ico/jpg/jpeg/webp/txt/xml,<br/>and router prefetches"}
    MATCH -->|"no"| PASS["Served without proxy<br/>no nonce needed"]
    MATCH -->|"yes"| NONCE["Generate nonce<br/>build CSP string"]
    NONCE --> PROT{"Protected path?<br/>/ , /new , /meine/*"}

    PROT -->|"no"| FWD
    PROT -->|"yes"| COOKIE{"Session cookie present?"}
    COOKIE -->|"no"| RED1["redirect → /login"]
    COOKIE -->|"yes"| VERIFY{"jwtVerify passes?<br/>clockTolerance 30s"}
    VERIFY -->|"no"| CLEAR["Set-Cookie maxAge=0<br/>then redirect → /login"]
    VERIFY -->|"yes"| FWD["Forward request with<br/>x-nonce + CSP request header"]

    FWD --> LAYOUT{"Layer 2 — (auth) layout<br/>getSession"}
    LAYOUT -->|"null"| RED2["redirect /login"]
    LAYOUT -->|"session"| PAGE{"Layer 3 — page / action<br/>requireSession or getSession"}
    PAGE -->|"null"| RED3["redirect /login"]
    PAGE -->|"session"| RENDER["Query Postgres, render RSC"]
```

- **Layer 1 — `src/proxy.ts`.** Cheap pre-filter. Verifies the JWT
  signature and expiry; on failure it clears the cookie explicitly and
  redirects to `/login`.
- **Layer 2 — `src/app/(auth)/layout.tsx`.** Calls `getSession()`
  server-side before any child page renders.
- **Layer 3 — the data-access-layer guard.** Every page that reads
  user-scoped or member-only data calls `requireSession()` from
  `src/lib/session.ts`; every Server Action calls `getSession()` again
  before it writes.

## Page map

```mermaid
flowchart TD
    subgraph Public["Public — no session required"]
        LOGIN["/login<br/>LoginCard + LoginForm<br/>email entry, language switcher"]
        VP["/verify-prompt?token=…<br/>VerifyPromptCard<br/>'Log me in' button"]
        VERIFY["/verify<br/>route handler only<br/>GET redirects, POST consumes"]
        IMP["/impressum<br/>§ 5 DDG, 5 languages"]
        DS["/datenschutz<br/>Art. 13 GDPR, 5 languages"]
        NF["not-found<br/>dynamic 404"]
    end

    subgraph Auth["(auth) route group — session required"]
        HOME["/<br/>Marketplace<br/>mode, categories, search,<br/>location radius, pagination"]
        NEW["/new<br/>CreateListingForm<br/>two-step wizard"]
        MINE["/meine<br/>MyListingsPageContent<br/>own listings + modal create"]
        EDIT["/meine/[id]/edit<br/>EditListingForm"]
    end

    subgraph API["Route handlers"]
        SEND["POST /api/auth/send-link"]
        HZ["GET /api/healthz<br/>edge runtime"]
    end

    LOGIN -->|"submit email"| SEND
    SEND -->|"mail with link"| VP
    VERIFY -->|"GET legacy link"| VP
    VP -->|"POST /verify → 303"| HOME

    HOME -->|"Post a new listing"| NEW
    HOME -->|"account menu"| MINE
    NEW -->|"published, after confetti"| HOME
    MINE -->|"Edit"| EDIT
    EDIT -->|"saved"| MINE
    MINE -->|"back to overview"| HOME
    MINE -->|"Create listing modal"| MINE

    HOME -->|"footer"| IMP
    HOME -->|"footer"| DS
    LOGIN -->|"footer links"| DS
    IMP <-->|"cross-link"| DS

    HOME -->|"logout server action"| LOGIN
```

Route inventory, with how each one renders:

| Route | Kind | Rendering | Session |
|-------|------|-----------|---------|
| `/` | page | `force-dynamic` | required |
| `/new` | page | dynamic — `requireSession()` reads cookies | required |
| `/meine` | page | `force-dynamic` | required |
| `/meine/[id]/edit` | page | `force-dynamic` | required |
| `/login` | page | dynamic — reads `searchParams` and the language cookie | none |
| `/verify-prompt` | page | dynamic | none |
| `/verify` | route handler | `runtime = 'nodejs'` | none |
| `/impressum` | page | `force-dynamic` | none |
| `/datenschutz` | page | `force-dynamic` | none |
| `not-found` | page | dynamic — `await headers()` keeps the nonce valid | none |
| `/api/auth/send-link` | route handler | dynamic | none |
| `/api/healthz` | route handler | `runtime = 'edge'` | none |
| `/robots.txt` | metadata route | static, built by `src/app/robots.ts` | none |

Everything that emits HTML is dynamic on purpose: the CSP nonce differs
per request, so a prerendered document would carry a nonce the response
header no longer matches and its bootstrap scripts would be blocked.

## Repository layout

```
src/
  app/                              App Router
    (auth)/                         auth-gated route group
      layout.tsx                    session backstop + Footer
      page.tsx                      marketplace, SQL filter/pagination
      new/page.tsx                  create listing
      new/NewListingPageHeader.tsx
      meine/page.tsx                own listings
      meine/[id]/edit/page.tsx      edit own listing
      meine/[id]/edit/EditListingForm.tsx
      meine/[id]/edit/EditListingPageHeader.tsx
    api/auth/send-link/route.ts     POST — issue a magic link
    api/healthz/route.ts            GET — liveness probe, edge runtime
    verify/route.ts                 GET legacy redirect, POST consumes token
    verify-prompt/                  confirmation page + VerifyPromptCard
    login/                          page + LoginCard + LoginForm
    datenschutz/                    Art. 13 GDPR notice
    impressum/                      § 5 DDG provider identification
    layout.tsx                      root layout, fonts, i18n provider, SpeedInsights
    not-found.tsx + NotFoundCard.tsx
    robots.ts                       generated /robots.txt, AI-crawler policy
    globals.css / theme.css / fonts.css
    icon.svg, apple-icon.png, favicon.ico
  actions/                          Server Actions
    auth.ts                         logout
    listings.ts                     createListing, updateListing, deleteListing
  components/
    layout/                         Header, Footer, LanguageButton, ScrollToTop,
                                    MyListingsHeader, LegalPageTopBar, LegalText
    marketplace/                    ModeToggle, CategoryTab(s), ListingCard,
                                    PaginationControls, DisclaimerOverlay,
                                    LocationSearch, PlaceSelect,
                                    CreateListingForm, CreateListingModal,
                                    MyListingsPageContent
    Marketplace.tsx                 client wrapper; filter/page state lives in the URL
  data/
    categories.ts                   built-in category tags + translation keys
    icons.tsx                       tag → icon map
  db/
    schema.ts                       listings, magic_tokens, rate_limits + indexes
    client.ts                       Drizzle over the Neon HTTP driver
    filters.ts                      withinRadius, resolvePlaceParam
  i18n/
    translations.ts                 UI strings, LANGUAGES, LangCode
    legalResources.ts               privacy + imprint wording, lazy namespace
    emailResources.ts               magic-link mail copy
    index.ts                        i18next instance factory
    Provider.tsx                    client provider
    server.ts                       getRequestLanguage, serverT, serverLegalTitle
    matchLanguage.ts                Accept-Language parsing, cookie constants
    legal.ts                        useLegalResources
  lib/
    env.ts                          Zod-validated process.env
    auth.ts                         token generation/hashing, userIdFromEmail
    session.ts                      JWT cookie, getSession, requireSession
    email.ts                        Brevo client, HTML + text mail rendering
    validators.ts                   Email, ListingInput, Uuid, isAllowedEmail
    rate-limit.ts                   Postgres-backed limiter + cleanup
    geo.ts                          place table, GPS snapping, haversine, bbox
    initials.ts                     avatar initials, display name
    useReducedMotion.ts             prefers-reduced-motion hook
  proxy.ts                          route gate + per-request CSP nonce
  instrumentation.ts                registerOTel + onRequestError
  types.ts                          Listing, Mode, Category
  constants.ts                      APP_NAME, CARD_SHADOW
  **/*.test.ts                      unit tests, co-located with their subject

docs/COMPLIANCE.md                  SSR and EU data-law audit record
docs/PERFORMANCE.md                 measured latency work
drizzle/                            generated SQL migrations + meta snapshots
public/                             logo, frog, flag SVGs
.github/workflows/test.yml          typecheck + lint + unit tests
drizzle.config.ts  next.config.ts  vercel.json  vitest.config.mts
eslint.config.mjs  postcss.config.mjs  tsconfig.json  package.json
```

The component layout under `src/components/` (and the supporting `data/`,
`i18n/`, `types.ts`, `constants.ts` files at the `src/` root) deliberately
mirrors the Figma reference package one-to-one, so a future design refresh
can be applied as a file-level overwrite rather than a manual port. See
*Component architecture* in [`BUILD.MD`](BUILD.MD) for the full prop
contracts.

## Installation

```bash
git clone https://github.com/InnoLab-2026/FeedmyFrog.git
cd FeedmyFrog
nvm use            # Node 24, per .nvmrc
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev        # http://localhost:3000
```

`src/lib/env.ts` validates the whole environment at import time and throws
on the first bad or missing variable, so a misconfigured `.env.local`
fails immediately and loudly rather than at the first database call.

## Configuration

Every variable below is required unless it has a default. The parser lives
in `src/lib/env.ts`.

```env
# Database (Neon, Frankfurt region) — must be a valid URL
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Auth
AUTH_SECRET="..."                         # >= 64 chars; use `openssl rand -hex 32`
MAGIC_LINK_TTL_MINUTES=15                 # default 15
SESSION_TTL_DAYS=7                        # default 7

# Email (sender is hardcoded in src/lib/email.ts — verified domain feedmyfrog.click)
BREVO_API_KEY="xkeysib-..."               # must start with `xkeysib-`

# Application (production: https://feedmyfrog.click)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_INSTITUTION_DOMAIN="reutlingen-university.de"  # must equal ALLOWED_EMAIL_DOMAIN
ALLOWED_EMAIL_DOMAIN="reutlingen-university.de"

# Rate limits (per hour, per dimension)
RATE_LIMIT_SEND_LINK_PER_IP=10            # default 10
RATE_LIMIT_SEND_LINK_PER_EMAIL=5          # default 5
```

Validation rules worth knowing:

- `AUTH_SECRET` is checked with `z.string().min(64)` — 32 random bytes in
  hex is exactly 64 characters.
- `BREVO_API_KEY` must start with `xkeysib-`, which catches a pasted
  SMTP password.
- `NEXT_PUBLIC_INSTITUTION_DOMAIN` and `ALLOWED_EMAIL_DOMAIN` are checked
  for equality by a schema-level `.refine()`. The first is inlined into
  the client bundle so the disclaimer can show `@(*.)domain`; the second
  is the value the server actually enforces. Letting them drift would show
  users one rule and apply another.
- `NODE_ENV` is parsed too, defaulting to `development`. It decides the
  session cookie name (`__Host-session` vs `session`), the cookie's
  `Secure` flag, and whether `'unsafe-eval'` is added to the CSP for HMR.

## Backend

### Route handlers

| Endpoint | Method | Contract |
|----------|--------|----------|
| `/api/auth/send-link` | `POST` | JSON `{ email, lang? }`. `415` if the content type is not JSON, `400` on unparsable JSON or an invalid address, `403` `forbidden_domain` for an outside domain, `429` with `Retry-After` when a rate limit is hit, `202` on success. There is no user table, so a valid in-domain address always yields `202` and there is nothing to enumerate. |
| `/verify` | `GET` | Legacy path for links from older mails. Redirects to `/verify-prompt?token=…` without touching the database, so a link-scanning bot cannot spend the token. Missing token → `/login?error=missing_token`. |
| `/verify` | `POST` | Accepts `application/x-www-form-urlencoded` or JSON. **`403` unless the request is same-origin** (`isSameOriginRequest`, see *Injection and CSRF posture*) — a form content type is a simple request, so CORS never gets a say. Otherwise consumes the token, creates the session cookie, `303` to `/`. Any failure is `303` to `/login?error=invalid_or_expired`. `runtime = 'nodejs'` because it hashes with `node:crypto`. |
| `/api/healthz` | `GET` | `{ "status": "ok" }` with `cache-control: no-store`. `runtime = 'edge'`; it deliberately does not touch the database, so it reports process liveness rather than Neon's availability. |

### Server Actions

Mutations are Server Actions rather than API routes, so Next.js applies
Origin-based CSRF protection automatically — it compares Origin against the
forwarded host and aborts a mismatch. Route handlers get none of that, which
is why `POST /verify` checks the origin itself. All four re-validate the
session before doing anything.

| Action | File | Returns |
|--------|------|---------|
| `createListing(prev, formData)` | `src/actions/listings.ts` | `{ ok: true }` or `{ ok: false, errors }`. Does **not** redirect: the form shows its confirmation on the result and navigates itself once the celebration has been seen. |
| `updateListing(prev, formData)` | `src/actions/listings.ts` | `{ ok: false, errors }` on failure; `redirect('/meine')` on success. The `UPDATE … WHERE id = ? AND user_id = ?` returns zero rows for a listing that is not yours, which surfaces as `not_found`. |
| `deleteListing(formData)` | `src/actions/listings.ts` | `void`. Scoped by `user_id` the same way. |
| `logout()` | `src/actions/auth.ts` | Clears both cookie names, `redirect('/login')`. |

Neither write touches coordinates. `location` is validated against
`PLACES` (`src/lib/geo.ts`) by `ListingInput`, and that name is the whole of
what is stored about where a listing is — see *Location as a closed set*
below.

### Shared library

| Module | Responsibility |
|--------|----------------|
| `lib/env.ts` | Zod-validated `process.env`, frozen and exported |
| `lib/auth.ts` | `generateToken()` (32 random bytes, base64url + SHA-256 hash), `hashToken()`, `userIdFromEmail()` = `sha256(lowercased email)` |
| `lib/session.ts` | `createSession`, `getSession`, `requireSession`, `destroySession`, `SESSION_COOKIE`. The JWT payload is re-validated with Zod after `jwtVerify`, so a correctly signed token with an unexpected shape is still rejected |
| `lib/email.ts` | Brevo client. Renders both an HTML part (table layout, inline styles, preheader, `color-scheme`, `lang`) and a real plain-text part |
| `lib/validators.ts` | `isAllowedEmail`, `Email`, `ListingType`, `ListingInput`, `Uuid` |
| `lib/csrf.ts` | `isSameOriginRequest` — the origin check `POST /verify` needs and Server Actions get for free |
| `lib/rate-limit.ts` | `checkAndConsume` (single-statement count-and-insert), `cleanupRateLimits` (returned unexecuted so it can ride along in a batch) |
| `lib/geo.ts` | `PLACES`, `Place`, `isPlace`, `PLACES_ALPHABETICAL`, `CITY_COORDS`, `DISTRICT_OF`, `haversineKm`, `findNearestTown`, `placesWithin`, `RADII`, `isRadius` |
| `lib/initials.ts` | `getInitials`, `displayNameFromEmail` |

Every helper that reads a secret or touches the database begins with
`import 'server-only'`, so the bundler refuses to include it in any client
bundle. `vitest.config.mts` aliases that package to its own no-op build,
because Vitest does not set Next's `react-server` resolve condition.

### Authentication flow

No passwords are stored and there is no user table.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant L as /login (client)
    participant API as POST /api/auth/send-link
    participant DB as Neon Postgres
    participant B as Brevo
    participant VP as /verify-prompt
    participant V as POST /verify

    U->>L: enter address, submit
    L->>API: JSON { email, lang }
    API->>API: Zod: valid address AND domain == base or *.base
    API->>DB: checkAndConsume ip + email limits, concurrently
    alt over limit
        API-->>L: 429 + Retry-After
    else allowed
        API->>API: generateToken → raw + sha256 hash
        API->>DB: batch — invalidate old tokens, insert hash + expiry,<br/>purge expired tokens, purge old rate-limit rows
        API->>B: send mail with /verify-prompt?token=raw
        API-->>L: 202 accepted
    end
    B-->>U: magic-link mail, valid 15 min
    U->>VP: click link (GET, no DB write)
    U->>V: press "Log me in" (form POST)
    V->>DB: UPDATE magic_tokens SET consumed = true<br/>WHERE hash = ? AND consumed = false AND expires_at > now()<br/>RETURNING email
    alt no row returned
        V-->>U: 303 → /login?error=invalid_or_expired
    else row returned
        V->>V: sign HS256 JWT { userId, email }
        V-->>U: Set-Cookie __Host-session, 303 → /
    end
```

Details that matter:

- **The domain check.** `isAllowedEmail` accepts the apex domain or any
  proper subdomain — `student.reutlingen-university.de`,
  `lb.reutlingen-university.de`. Look-alikes such as
  `evil-reutlingen-university.de` and
  `reutlingen-university.de.attacker.com` are rejected, because the
  subdomain branch requires a literal `.` separator before the base.
- **GET never consumes.** The mail links to `/verify-prompt?token=…`,
  which renders a button. Only the `POST /verify` that button submits
  spends the token, so link-scanning bots and mail-security previewers
  cannot burn someone's login.
- **One atomic statement.** The `UPDATE … RETURNING` checks the hash,
  asserts the row is unconsumed, asserts it has not expired, and marks it
  consumed in a single statement. That closes the read-then-write window
  in which two concurrent clicks could both succeed.
- **Cookie.** HTTP-only, `SameSite=Lax`, `Path=/`, `Secure` in
  production, where it is named `__Host-session` — and in production that
  is the **only** name read. Development, which has no TLS, uses the plain
  `session` and reads only that. TTL is `SESSION_TTL_DAYS`.
- **Algorithm.** `jwtVerify` pins `algorithms: ['HS256']`, so a token's own
  header can never choose how it is verified.
- **Clearing.** The proxy clears an expired cookie with an explicit
  `Set-Cookie … maxAge=0` rather than `.delete()`. Browsers silently
  ignore deletion headers that omit the `Secure` and `Path=/` attributes
  a `__Host-` prefix requires, so a plain delete would leave the stale
  cookie in place until its natural expiry.
- **Old links die.** Each new request marks every unconsumed token for
  that address as consumed *before* inserting the new one — ordering that
  is guaranteed because the four statements go out as one `db.batch`.
- **Identity.** `userId` is `sha256(email)`, so the same person gets a
  stable identifier across sessions without any user record existing.

### Listing lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant F as CreateListingForm / EditListingForm
    participant A as Server Action
    participant DB as Neon Postgres
    participant M as /  (marketplace RSC)

    U->>F: step 1 — need or offer, 1–2 category tags
    U->>F: step 2 — title, description,<br/>location from the dropdown, free hashtags
    F->>A: FormData via useActionState
    A->>A: getSession, else redirect /login
    A->>A: ListingInput.safeParse — codes, not prose
    alt invalid
        A-->>F: { ok:false, errors } → i18n renders error_<code>
    else valid
        A->>DB: INSERT, or UPDATE … WHERE id AND user_id<br/>place name only — no coordinates
        A->>A: revalidatePath('/'), revalidatePath('/meine')
        alt create
            A-->>F: { ok:true } → confetti, then router.push('/')
        else update
            A-->>M: redirect('/meine')
        end
    end

    U->>M: delete from /meine
    M->>A: deleteListing(formData)
    A->>DB: DELETE … WHERE id AND user_id
    A->>A: revalidatePath('/'), revalidatePath('/meine')
```

Validator messages are short machine-readable codes
(`title_too_short`, `forbidden_domain`, …), never prose. The server does
not know the reader's language; the client maps `error_<code>` through
i18next. Constraints: title 3–120 characters, description 10–2000, at
most 8 tags of at most 40 characters each, and `location` must be one of
the twenty names in `PLACES` — there is no length rule because there is no
free text.

### Data model

One business table holds every listing — both *Suche* and *Biete* —
distinguished by an enum column. Two internal tables hold hashed
magic-link tokens and rate-limit counters.

```mermaid
erDiagram
    LISTINGS {
        uuid        id PK
        text        user_id  "sha256(email)"
        text        email    "shown on the card"
        listing_type type    "need | offer"
        text        title
        text        description
        text_array  tags     "default {}"
        text        location "one of the 20 names in PLACES"
        timestamptz created_at
    }
    MAGIC_TOKENS {
        text        token_hash PK "sha256 of the raw token"
        text        email
        timestamptz expires_at
        boolean     consumed "default false"
    }
    RATE_LIMITS {
        uuid        id PK
        text        key "send-link:ip:… | send-link:email:…"
        timestamptz created_at
    }
```

There are no foreign keys, because there is no user table to point at:
`listings.user_id` and `magic_tokens.email` are the only identity there
is. Indexes, all defined in `src/db/schema.ts`:

| Index | Type | Serves |
|-------|------|--------|
| `idx_listings_type_created` | btree `(type, created_at DESC)` | the default mode-filtered, newest-first page |
| `idx_listings_user` | btree `(user_id)` | `/meine` and the ownership check on update/delete |
| `idx_listings_location` | btree `(location)` | the radius filter's `location IN (…)` |
| `idx_listings_tags` | GIN `(tags)` | category tabs, `tags @> ARRAY[…]` — a btree cannot answer array containment at all |
| `idx_listings_title_trgm` | GIN `(title gin_trgm_ops)` | `ILIKE '%q%'` search; a leading wildcard makes btree useless |
| `idx_listings_desc_trgm` | GIN `(description gin_trgm_ops)` | the same, over the description |
| `idx_magic_tokens_email` | btree | invalidating an address's outstanding tokens |
| `idx_magic_tokens_expires` | btree | the expiry sweep |
| `idx_rate_limits_key_created` | btree `(key, created_at)` | the windowed count in `checkAndConsume` |

The trigram indexes require `pg_trgm`. `drizzle-kit generate` does not
emit extension statements, so `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
is written by hand at the top of `drizzle/0002_*.sql` — **it must be put
back if that migration is ever regenerated.**

`listings` matches the Figma `Listing` TypeScript interface field for
field, so designer-owned components consume database rows with no mapping
layer, plus the `created_at` used for ordering.

The schema holds no profile picture, age, gender, telephone number, or any
other personal attribute beyond the address a listing exists to show.

### Marketplace query

The marketplace reads its entire filter state from the URL and translates
it into SQL. Nothing is filtered in JavaScript.

```mermaid
flowchart TD
    URL["/?mode=&cat=&q=&page=&per=&loc=&r=&near="] --> PARSE["Parse and clamp<br/>mode ∈ {need, offer}<br/>per ∈ {15,30,50}<br/>cat ≤ 40 chars, q ≤ 200 chars<br/>r ∈ {3,5,10,20} km"]
    PARSE --> PLACE["resolvePlaceParam(loc)<br/>name looked up server-side,<br/>never coordinates from the URL"]
    PLACE --> WHERE["Build WHERE<br/>type = mode<br/>AND tags @> ARRAY[cat]<br/>AND (title ILIKE q OR description ILIKE q)<br/>AND withinRadius(place, r)"]
    WHERE --> BATCH["db.batch — one HTTPS round trip"]
    BATCH --> C1["COUNT(*) for page clamping"]
    BATCH --> C2["unnest(tags), count(*) GROUP BY 1<br/>ORDER BY 2 DESC — category tabs"]
    BATCH --> C3["SELECT … ORDER BY created_at DESC<br/>LIMIT per OFFSET (requestedPage-1)*per"]
    C1 --> CLAMP{"requestedPage > totalPages?"}
    C3 --> CLAMP
    CLAMP -->|"no"| RENDER["Render Marketplace"]
    CLAMP -->|"yes"| REFETCH["One extra query at the clamped page"] --> RENDER
    C2 --> RENDER
```

- **Search** is a parameterized `ILIKE` over title and description, with
  `\`, `%` and `_` escaped in the user's input so a typed wildcard is
  matched literally.
- **Location** travels as a place *name*. The server looks it up in
  `CITY_COORDS`; an unknown name yields `undefined`, which drizzle's
  `and()` drops, so the filter is simply not applied rather than silently
  matching nothing. A crafted link cannot ask about an arbitrary point on
  the map.
- **Radius** is a plain `location IN (…)`. `placesWithin()` does twenty
  great-circle distances in memory, once per request, and hands the database
  a set of names — no coordinate per row, no bounding box, no trigonometry
  in SQL.
- **Category tabs** are aggregated in the database and ranked by
  frequency within the current mode, so every tag actually in use gets a
  tab.
- **Round trips**, not query time, dominate: `@neondatabase/serverless`
  opens a fresh HTTPS request per query. The marketplace went from three
  queries in two dependent waves to one `db.batch`; `send-link` went from
  eight serial round trips to two. See
  [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for the measurements and
  how to reproduce them.

### Rate limiting

`POST /api/auth/send-link` is limited per IP and per email address. Both
dimensions are consumed concurrently, and each is a single statement:

```sql
WITH used AS (SELECT count(*) FROM rate_limits WHERE key = $1 AND created_at >= $2),
     consumed AS (INSERT INTO rate_limits (key) SELECT $1 FROM used WHERE used.n < $3 RETURNING 1)
SELECT used.n, (SELECT count(*) FROM consumed) FROM used
```

The `INSERT`'s own `SELECT` re-reads the tally inside the same statement,
so the decision and the write cannot be separated by another
transaction's commit — the check-then-act race a read-then-write pair
would have. The caller is told the request was consumed only if a row was
actually inserted. A cleanup delete of rows older than six hours rides
along inside the same batch as the token writes.

### Security headers and CSP

Static headers are set in `next.config.ts` for `/:path*`:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=()` |
| `X-Robots-Tag` | `noai, noimageai` |

`poweredByHeader` is off.

`geolocation` is the one entry that is `(self)` rather than the empty
`()` the other three carry. An empty allowlist disables a feature for
*this document* as well as for nested frames, not only for third-party
embeds — so `geolocation=()` refused the app's own "Use GPS location"
button in `LocationSearch`, and the UI fell through to its `gps_error`
message wherever a browser enforced the header. `(self)` keeps every
embedded frame out while leaving the top-level document able to ask.
Nothing else changes: the fix is requested only on a click, the
browser's own permission prompt is still the gate the user sees, and the
position is reduced to a town name before it leaves the callback (see
*Location filter and GPS*). `camera`, `microphone` and `payment` stay
fully disabled — the app never uses them.

The `Content-Security-Policy` is **not** static — it carries a
per-request nonce and is therefore built in `src/proxy.ts`:

```
default-src 'self'
script-src  'self' 'nonce-<value>' 'strict-dynamic'      (+ 'unsafe-eval' outside production, for HMR)
style-src   'self' 'unsafe-inline'
img-src     'self' data:
font-src    'self' data:
connect-src 'self'
form-action 'self'
frame-ancestors 'none'
base-uri 'self'
object-src 'none'
```

There is no `'unsafe-inline'` for scripts. The proxy forwards the policy
on the *request* headers so Next.js stamps the nonce onto its own inline
bootstrap scripts, and exposes it as `x-nonce` for any future custom
`<script>`. Styles keep `'unsafe-inline'` because the design system uses
inline `style` attributes throughout.

### Injection and CSRF posture

An attacker-insertion audit of every path where untrusted input reaches a
sink. The four findings it produced are fixed; the rest is recorded so the
next reader does not have to re-derive it.

| Vector | Status |
|---|---|
| SQL injection (search, category, radius, rate limiter) | **Safe.** Everything is a bound parameter — payloads never reach the SQL text. User-typed `%` and `_` are escaped, verified against real Postgres: searching `100%` matches only the row literally containing "100%". |
| XSS | **Safe.** No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `sql.raw` anywhere in `src/`. i18next runs with `escapeValue: false` *because* React escapes — a latent trap if any of this ever moves to raw HTML. |
| Mass assignment | **Safe.** Actions build their input from a fixed field list and `ListingInput` strips the rest, so a posted `lat`/`lng` is never read. |
| `mailto:` header injection | **Safe.** `listing.email` is interpolated unencoded, but Zod's `.email()` rejects `?`, `&`, quotes, CRLF and spaces — the safety rests entirely on that regex. |
| Open redirect / magic-link host poisoning | **Safe.** Redirects are `new URL(path, req.url)`, same-origin; the magic link is built from `NEXT_PUBLIC_BASE_URL`, never the `Host` header. |
| CSRF on `POST /api/auth/send-link` | **Safe.** The JSON content type forces a preflight and no CORS headers are sent, so a browser blocks it. |
| CSRF on `POST /verify` | **Fixed.** It takes a form content type — a simple request, no preflight — and had no origin check, so a cross-site form could hand a victim a session for the *attacker's* account. Now `403` unless same-origin. |
| Prototype-chain lookups | **Fixed.** `MESSAGES[?error=]`, `iconMap[tag]` and `tag in TRANSLATION_KEYS` all reached `Object.prototype`. `/login?error=__proto__` rendered an object as a React child and returned **500** — a crafted-link DoS of the one page an unauthenticated visitor needs. All three now use `Object.hasOwn`. |
| `__Host-` session cookie | **Fixed.** Production also accepted a plain `session` cookie, giving back exactly what the prefix buys: a subdomain cannot set a `__Host-` cookie but can set an unprefixed one, which is enough to fix a reader into an attacker's session. Production now reads only the prefixed name. |
| JWT algorithm confusion | **Hardened.** `algorithms: ['HS256']` is pinned, per RFC 8725. |
| Rate-limit IP spoofing | **Hardened.** The limiter keys on the leftmost `x-forwarded-for`, the classic spoofable position. Vercel overwrites that header on the way in specifically to prevent this, so it was not exploitable here — but that is a property of the host, not the code, and `x-forwarded-for` is also what a proxy *in front of* Vercel would rewrite. `x-vercel-forwarded-for` is now preferred. |
| Tag/translation-key confusion | **Fixed.** User tags were passed to `t()` as keys, so a listing tagged `logout` rendered a tab labelled "Log out". Only known category keys are looked up now; anything else renders verbatim. |

Two of these were only reachable because a *different* bug masked them:
`isStandardCategory` returned `true` for `constructor` and `__proto__`, which
filtered those tags out before `iconMap[tag]` could evaluate them. Fixing that
predicate alone would have turned a listing tagged `__proto__` into a **stored**
crash for every viewer of that mode — so the pair had to move together, and
`src/data/categories.test.ts` now holds them together.

## Frontend

### Component tree

```mermaid
flowchart TD
    ROOT["app/layout.tsx (server)<br/>fonts, generateMetadata, SpeedInsights"] --> I18N["I18nProvider (client)"]
    I18N --> AL["(auth)/layout.tsx (server)<br/>getSession backstop"]
    I18N --> LOGINP["login/page.tsx (server)"]
    I18N --> LEGAL["datenschutz / impressum (server)"]

    AL --> MP["Marketplace.tsx (client)<br/>owns no filter state — reads props,<br/>writes the URL"]
    AL --> FOOT["Footer"]
    MP --> HDR["Header (client)"]
    HDR --> LS["LocationSearch<br/>place + radius + GPS"]
    HDR --> LB["LanguageButton"]
    HDR --> DO["DisclaimerOverlay"]
    HDR --> LOGOUT["logout server action"]
    MP --> MT["ModeToggle"]
    MP --> CT["CategoryTabs → CategoryTab<br/>overflow folds into 'more categories'"]
    MP --> PC["PaginationControls ×2"]
    MP --> LC["ListingCard × page size"]
    MP --> STT["ScrollToTop"]

    AL --> MLP["MyListingsPageContent (client)"]
    MLP --> MLH["MyListingsHeader"]
    MLP --> CLM["CreateListingModal → CreateListingForm"]
    MLP --> LCO["ListingCard with ownerActions:<br/>Edit link + delete form"]

    AL --> NEWP["new/page.tsx (server)"] --> CLF["CreateListingForm (client)<br/>two-step wizard, confetti"]
    AL --> EDP["meine/[id]/edit (server)"] --> ELF["EditListingForm (client)"]
    CLF --> KPD["PlaceSelect<br/>closed dropdown"]
    ELF --> KPD

    LOGINP --> LCARD["LoginCard (client)<br/>HoppingFrog, links"] --> LFORM["LoginForm<br/>fetch → /api/auth/send-link"]
    LEGAL --> LTB["LegalPageTopBar"]
    LEGAL --> LTXT["LegalText primitives<br/>useLegalResources lazy namespace"]
```

### State model: the URL is the state

`Marketplace.tsx` holds no filter state of its own. It receives
`listings`, `totalCount`, `page`, `perPage`, `mode`, `category`, `query`,
`categoryTags`, `place`, `radiusKm`, `approximate` and `email` as props,
and every designer-owned child keeps the prop contract it had in Figma.
Their callbacks are translated into router navigations:

| Interaction | URL effect | Navigation |
|-------------|-----------|------------|
| Mode toggle | `?mode=`, resets `cat`, `page` | `push` |
| Category tab | `?cat=`, resets `page` | `push` |
| Search box | `?q=` after a 300 ms debounce, resets `page` | `replace` — typing must not fill the history stack |
| Pagination | `?page=` | `push` |
| Items per page | `?per=`, resets `page` | `push` |
| Location / radius | `?loc=`, `?r=`, `?near=`, resets `page` | `push` |

Defaults are omitted from the query string, so the clean marketplace URL
is just `/`. Navigations run inside `startTransition`, and the listing
grid drops to `opacity: 0.6` while a transition is pending. The only
genuinely local state is the search input itself, so typing stays
responsive between debounce ticks; a reconciliation check adopts a new
server `query` value unless the user has typed since.

### Location as a closed set

Everywhere a location appears — the listing itself and the filter alike —
it is one of the twenty names in `PLACES` (`src/lib/geo.ts`). Nothing about
a location is free text, and the database holds no coordinate at all.

```mermaid
flowchart TD
    subgraph Write["Creating or editing a listing"]
        SEL["PlaceSelect &lt;select&gt;<br/>21 options: a placeholder + the 20 names"]
        VAL["ListingInput: z.enum(PLACES)<br/>the enforcement boundary"]
        ROW[("listings.location = 'Reutlingen'<br/>no lat, no lng")]
        SEL --> VAL --> ROW
        BYPASS["A request that skips the form"] -->|"'Musterweg 12'<br/>'48.49, 9.20'"| VAL
        VAL -.->|"rejected: location_invalid"| NOPE["nothing stored"]
    end

    subgraph Read["Filtering the marketplace"]
        GPS["GPS fix<br/>lat/lng in the callback only"]
        SNAP["findNearestTown<br/>district → parent town"]
        NAME["a place NAME"]
        URLP["?loc=Reutlingen&amp;r=10"]
        PW["placesWithin: 20 haversines in memory"]
        SQL["WHERE location IN ('Reutlingen','Betzingen',…)"]
        GPS --> SNAP --> NAME
        PICK["Typed or picked in LocationSearch"] --> NAME
        NAME --> URLP --> PW --> SQL
        SQL --> ROW
    end
```

The three places a coordinate could have leaked are each closed:

| Route in | What stops it |
|---|---|
| The listing form | `<select>` — a dropdown cannot produce anything else |
| A request that bypasses the form | `z.enum(PLACES)` rejects it as `location_invalid`; the action also builds its input from a fixed field list, so a posted `lat`/`lng` is never even read |
| The URL | `?loc=` is a name looked up against `PLACES`; an unknown value applies no filter |

`CITY_COORDS` still exists — the GPS snap and the radius set both need
distances — but it is a **constant of the code, not a column**. Storing a
copy per row would have duplicated a lookup as personal data, which is what
`0003` removed.

### The filter control and GPS

`LocationSearch` offers the 20 places in `PLACES` by substring match
and four radii (3, 5, 10, 20 km, default 10). The GPS button asks the
browser for a **coarse** fix — `enableHighAccuracy: false`,
`maximumAge` 30 minutes, `timeout` 10 s — and then throws the position
away:

- `findNearestTown()` picks the closest known reference point and, if
  that point is a *district* of Reutlingen, resolves it to Reutlingen
  itself. Districts take part in the search but are never the answer:
  returning "Betzingen" would pin the reader to a neighbourhood, while
  excluding districts outright would put a Reutlingen resident in the
  next municipality, because a fix taken in Betzingen is closer to
  Wannweil's centre than to Reutlingen's.
- Beyond `GPS_MAX_DISTANCE_KM` (50 km) no town is returned at all,
  rather than labelling someone in Hamburg as near Stuttgart.
- Only the resulting town name reaches the URL, and `?near=1` records
  that it came from a fix so the control can keep saying "Near X" across
  a navigation. Nothing downstream ever sees a position more precise than
  a town centre.

Note the asymmetry between the two paths, which is deliberate: a **GPS
fix** never resolves to a district (returning "Betzingen" would pin the
reader to a neighbourhood), but a district is a perfectly good thing to
**choose** from the dropdown for a listing, because that is the author
saying where their listing is.

### Categories and tags

`src/data/categories.ts` is the single source of truth for the nine
built-in categories (`Familie`, `Kinder`, `Wochenende`, `Mobilität`,
`Pendeln`, `Verkauf`, `Dienstleistungen`, `Transport`, `Bildung`). They
are stored as plain German tag strings, because that is what ends up in
`listings.tags`; the UI never shows the raw string, it renders
`t(getCategoryTranslationKey(tag))`. The create form offers exactly these
as quick-picks (at most 2 per listing, leaving room under the server's cap
of 8 for free-form hashtags), and the marketplace renders exactly these as
the always-present tabs, followed by every other tag actually in use,
ranked by frequency. A free-form hashtag therefore always has a tab that
filters to it. `src/data/icons.tsx` maps tags to icons, falling back to a
search glyph.

### Internationalisation

Five languages: **EN, DE, FR, TR, ES** (`LANGUAGES` in
`src/i18n/translations.ts`). Three resource bundles serve different
purposes:

| Bundle | Loaded | Used by |
|--------|--------|---------|
| `translations.ts` | in every i18next instance | the whole UI |
| `legalResources.ts` | lazily, per instance, by `useLegalResources` | `/datenschutz`, `/impressum` only — the full policy in five languages must not ship with every route |
| `emailResources.ts` | server-side only | the magic-link mail |

```mermaid
flowchart LR
    R["Request"] --> C{"lang cookie set?"}
    C -->|"yes"| USE["Render in that language"]
    C -->|"no"| AL{"Accept-Language,<br/>parsed per RFC 9110 §12.5.4"}
    AL -->|"a supported tag"| USE
    AL -->|"none"| EN["English"] --> USE
    USE --> HTML["html lang + page title correct<br/>in the first byte"]
    HTML --> HYD["Hydration — no flash of English"]
    SW["LanguageButton cycles"] --> COOKIE["Set lang cookie, 1 year,<br/>SameSite=Lax, Secure on https"]
    COOKIE --> R
```

The language is resolved on the server, before anything renders, so
`<html lang>` and every `<title>` are right in the first byte and
hydration has nothing to correct. `getI18nInstance()` builds a **fresh
instance per server render** — the module is shared by every concurrent
request, and a render that yields at an `await` could otherwise resume
after another reader changed the language. On the client there is only
ever one reader, so the instance is built once. Server components and
`generateMetadata` use `serverT()`, a plain object lookup that cannot
hold state at all. `I18nProvider` also carries a one-time migration for
users whose choice predates the cookie and still lives in
`localStorage`.

### Design tokens and typography

`src/app/theme.css` defines one shared type scale in a private `--fs-*`
namespace (`--fs-2xs` 12px through `--fs-4xl` 38px, in `rem` so the
reader's root font size is respected), plus purpose aliases
`--fs-control-input` and `--fs-control-button` so header and body controls
resolve to identical sizes. Tailwind's own `--text-*` utilities are left
untouched. Fonts are **Plus Jakarta Sans** (base) and **DM Sans**
(display), loaded through `next/font/google`, which downloads them at
build time and self-hosts them — no runtime request ever reaches Google.
`src/app/fonts.css` is intentionally empty; it exists so the design
package's import chain still resolves.

### Accessibility and motion

- Listing cards are focusable, carry `role="article"` and an `aria-label`
  assembled from title, description, tags and location, and paint a
  3px focus outline.
- The account menu is `aria-haspopup="menu"` / `aria-expanded`, closes on
  outside `mousedown`, and the disclaimer is a real `role="dialog"`
  `aria-modal`.
- The mail button's subject is one interpolated sentence rather than
  concatenation, because the separator and its spacing are part of the
  sentence — French puts a space before the colon.
- `usePrefersReducedMotion()` shortens the publish celebration from 1800 ms
  to 700 ms, and the login page's pointer-following frog never starts at
  all under `prefers-reduced-motion: reduce`. It is decorative, so it is
  `aria-hidden` and ignores pointer events; its position is written
  through a ref inside one `requestAnimationFrame` per frame rather than
  through React state.
- Images go through `next/image` — the header logo is `priority` because
  it is the LCP candidate on wider viewports.

## Testing and quality gates

**348 unit tests across 17 files**, run with Vitest in a Node
environment against `src/**/*.test.ts`. Counts below are the expanded
case counts as Vitest reports them — several suites use `it.each` over
the five locales.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint 9, eslint-config-next core-web-vitals + typescript
npm test            # vitest run
npm run test:watch  # vitest
```

| File | Tests | Covers |
|------|-------|--------|
| `src/data/categories.test.ts` | 43 | that no prototype member is mistaken for a category, that `iconFor` never returns a function or object, and that a user tag cannot borrow a UI string |
| `src/i18n/translations.test.ts` | 38 | key parity, empty strings and placeholder parity across all five languages |
| `src/i18n/emailResources.test.ts` | 34 | the same parity checks for the mail copy, plus no emoji and no markup |
| `src/lib/geo.test.ts` | 32 | haversine, GPS town snapping and the district rule, `PLACES` integrity, `isPlace`, `placesWithin` symmetry and monotonicity |
| `src/i18n/legal.test.ts` | 31 | legal namespace registration, key parity, permitted inline markup |
| `src/lib/validators.test.ts` | 28 | the domain rule including look-alike rejection, all `ListingInput` bounds, and that `location` accepts only `PLACES` |
| `src/i18n/matchLanguage.test.ts` | 22 | `Accept-Language` parsing, q-value ordering, tag normalisation |
| `src/lib/email.test.ts` | 22 | Brevo payload shape, HTML escaping, both mail parts, per-locale rendering |
| `src/actions/listings.test.ts` | 21 | create/update/delete: session guard, validation codes, ownership scoping, `revalidatePath`, and that no coordinate is written or accepted from a request |
| `src/db/filters.test.ts` | 19 | `withinRadius` / `resolvePlaceParam` and migration `0003`'s normalisation against a **real Postgres engine** — `@electric-sql/pglite` with `pg_trgm` loaded; also asserts the `lat`/`lng` columns are gone |
| `src/lib/initials.test.ts` | 13 | initials and display names from an address |
| `src/lib/csrf.test.ts` | 12 | the origin check `POST /verify` relies on: cross-site and subdomain refused, look-alike hosts refused, Sec-Fetch-Site trusted over a forgeable Origin |
| `src/lib/auth.test.ts` | 11 | token generation, hashing, `userIdFromEmail` stability |
| `src/lib/rate-limit.test.ts` | 8 | allow/deny at the boundary, `Retry-After`, cleanup cutoff |
| `src/lib/session.test.ts` | 7 | cookie attributes, payload re-validation, expiry |
| `src/lib/session.production.test.ts` | 6 | that production reads **only** `__Host-session`, and that a token signed with another algorithm is refused |
| `src/actions/auth.test.ts` | 1 | logout clears both cookie names and redirects |

The `filters.test.ts` choice is deliberate: SQL built by a query builder
can be syntactically valid and semantically wrong, and mocking the
database would make exactly that class of bug invisible. It runs against
a real engine instead.

### End-to-End (E2E) Testing with Cypress

Browser E2E testing architecture established by **Meinhard Holzknecht**. E2E specifications reside in `cypress/e2e/`.

```bash
npm run test:e2e      # Run Cypress E2E tests headless (cypress run)
npm run cypress:open  # Open interactive Cypress Test Runner UI
```

## DevOps

### CI

`.github/workflows/test.yml` runs on every push to `main` and on every
pull request:

```mermaid
flowchart LR
    PR["Push to main / pull request"] --> CO["actions/checkout@v4"]
    CO --> NODE["actions/setup-node@v4<br/>node-version-file: .nvmrc, npm cache"]
    NODE --> CI["npm ci"]
    CI --> TC["npm run typecheck"]
    TC --> LT["npm run lint"]
    LT --> UT["npm test"]
    UT --> OK["Green — mergeable"]
    TC -.->|"fail"| RED["Red"]
    LT -.->|"fail"| RED
    UT -.->|"fail"| RED
```

The job is named *Typecheck, lint & unit tests* and runs on
`ubuntu-latest`. All three steps must pass before a pull request is
merged. Node comes from `.nvmrc`, so CI and local development cannot
drift.

### Deployment pipeline

The production stack is **live at `https://feedmyfrog.click`**: hosting on
Vercel with the project chained to this repository, the database on Neon
in Frankfurt, and Brevo handling outbound mail from the verified sender
domain. The terms and data processing agreements of all three platforms
have been accepted.

```mermaid
flowchart TD
    DEV["Local: npm run dev<br/>own Neon branch"] --> PUSH["git push"]
    PUSH --> PR["Pull request"]
    PUSH --> MAIN["Merge to main"]

    PR --> GHA["GitHub Actions<br/>typecheck + lint + tests"]
    PR --> PREV["Vercel Preview build<br/>unique URL, commented on the PR"]
    PREV --> PMIG["vercel-build:<br/>drizzle-kit migrate → Neon preview branch"]
    PMIG --> PBUILD["next build"]
    PBUILD --> REVIEW["Reviewed by IT / project owner"]
    REVIEW --> MAIN

    MAIN --> PROD["Vercel Production build"]
    PROD --> MIG["vercel-build:<br/>drizzle-kit migrate → Neon main branch"]
    MIG --> BUILD["next build"]
    BUILD --> DEPLOY["Functions deployed to fra1"]
    DEPLOY --> DOMAIN["feedmyfrog.click"]
    DEPLOY --> OBS["Observability: OTel spans,<br/>Speed Insights, onRequestError logs"]
    DEPLOY -.->|"faulty release"| RB["Promote the previous<br/>successful deployment"]
```

| Branch / event | Vercel deployment | Database |
|----------------|-------------------|----------|
| Push to `main` | Production | Neon main branch |
| Pull request to `main` | Preview, unique URL per PR | Neon preview branch |
| Local `npm run dev` | not deployed | local or development Neon branch |

### Initial setup

1. Push the repository to GitHub.
2. Create a Vercel project and import the repository. Vercel detects
   Next.js automatically.
3. Add the variables from `.env.example` under *Project Settings →
   Environment Variables*, for all three scopes: *Production*,
   *Preview*, *Development*. A separate Neon branch for previews is
   recommended so pull requests never write to production data.
4. Connect the custom domain under *Project Settings → Domains*. In
   production this is `feedmyfrog.click`; a university subdomain such as
   `dienstleistungen.reutlingen-university.de` can be added the same way
   after the migration review.

### Region

`vercel.json` pins functions to **`fra1`** (Frankfurt):

```json
{ "$schema": "https://openapi.vercel.sh/vercel.json", "regions": ["fra1"], "framework": "nextjs" }
```

Vercel's default is `iad1`, Washington DC. Because the HTTP driver pays a
full round trip per query, running in `iad1` against a Frankfurt database
would add roughly 90–120 ms *per query*. Colocating the function with the
data is worth more than any query tuning in this codebase — and the
readership is a German university, so it is closer to the users too.

### Migrations

Migrations are applied during the Vercel build:

```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "drizzle-kit migrate && next build"
  }
}
```

Vercel runs `vercel-build` if it is defined, falling back to `build`. The
migration step uses `DATABASE_URL` from the active environment scope, so
production deploys migrate the production database and preview deploys
migrate the preview branch. Local migrations against the production
database are not part of the workflow.

Locally:

```bash
npx drizzle-kit generate   # generate SQL from the current schema
npx drizzle-kit migrate    # apply pending migrations against DATABASE_URL
npx drizzle-kit push       # early development only — no migration file
```

Current migrations:

| File | Contents |
|------|----------|
| `0000_wise_the_liberteens.sql` | `listing_type` enum, the three tables, five btree indexes |
| `0001_aspiring_mandrill.sql` | `lat`/`lng` columns, `idx_listings_coords`, and a backfill that places existing rows with the same matching rule as `resolveLocation()` — longest name wins, so `Kirchentellinsfurt` is not matched by a shorter name inside it |
| `0002_romantic_virginia_dare.sql` | `CREATE EXTENSION pg_trgm` (hand-written), the GIN tag index and the two trigram indexes |
| `0003_bumpy_big_bertha.sql` | Location becomes a closed set: normalises legacy free text to the canonical name (hand-written, same matching rule as `0001`), then drops `lat`, `lng` and `idx_listings_coords` and adds `idx_listings_location`. Rows naming nowhere we know are deliberately left untouched — the file carries a query to list them |

### Rollback

Vercel keeps every previous deployment; a faulty release is reverted by
promoting the previous successful build from the *Deployments* tab.
Database migrations are forward-only — a schema rollback requires an
additional migration that reverses the change.

### Manual deployment

For a one-off deployment without going through Git:

```bash
npm install -g vercel
vercel              # preview deployment
vercel --prod       # production deployment
```

Emergency fixes only. The Git workflow above is the primary path.

### Observability

Two first-party instruments, both inert off Vercel:

- **`src/instrumentation.ts`** — `registerOTel({ serviceName: 'feedmyfrog' })`
  gives server-side spans under the deployment's *Observability* tab, with
  no exporter configuration and no third-party account. What that buys
  over Vercel's built-in function timings is the shape *inside* a request:
  a 300 ms response caused by eight serial database calls and one caused
  by rendering look identical in function duration and are fixed very
  differently. The same file exports `onRequestError`, which logs every
  uncaught server-component, route-handler or Server Action error as one
  JSON line with path, method, router kind, route path and render source —
  without it those errors are a digest hash in the client and an ungrouped
  line in the runtime log.
- **`<SpeedInsights />`** in `src/app/layout.tsx` — real-user Core Web
  Vitals per route. It renders no markup and appends its own script, which
  is why it survives the `strict-dynamic` CSP: a script *tag* in the HTML
  would need the per-request nonce and the package has no prop for one,
  but a script created by the already-trusted bundle inherits its trust.
  Its beacon is same-origin, so `connect-src 'self'` covers it.

### Health checks and crawler policy

`GET /api/healthz` returns `{"status":"ok"}` with `cache-control:
no-store` on the edge runtime. It intentionally does not query the
database, so it answers "is the process serving?" rather than "is Neon
up?".

`src/app/robots.ts` is a Next.js metadata route, turned into a static
`/robots.txt` at build time and served from Vercel's edge. It disallows
the 46 named AI/LLM/agent crawler user-agents in `AI_CRAWLERS` site-wide, and gives the wildcard
rule access only to `/login`, `/impressum` and `/datenschutz` while
disallowing `/`, `/meine/`, `/new`, `/verify`, `/verify-prompt` and
`/api/`. Because `robots.txt` is only advisory, it is paired with the
`X-Robots-Tag: noai, noimageai` response header and, above all, with the
fact that all real content sits behind a session cookie.

### Dependency hygiene

`package.json` carries an `overrides` block pinning transitive
dependencies that had open advisories — `postcss`, `sharp`,
`brace-expansion`, `js-yaml`, `esbuild`. When bumping `next` or the
ESLint toolchain, check whether an override has become redundant before
carrying it forward.

## Data protection

The platform is subject to the GDPR, the German TDDDG (§ 25 governs
cookies and terminal-equipment access) and the German DDG (§ 5 Impressum
duty). The full audit record with sources is in
[`docs/COMPLIANCE.md`](docs/COMPLIANCE.md). The following properties
implement the requirements.

**Transparency duties.** A public privacy notice (Art. 13 GDPR) lives at
`/datenschutz` and a provider identification (§ 5 DDG) at `/impressum`,
both in all five languages. Both are linked from the footer and from the
login page — the point at which the email address is collected. The
controller and provider identity fields are clearly marked placeholders in
`src/i18n/legalResources.ts` and **must be filled in before the internal
pilot**.

**Data minimisation (Art. 5(1)(c)).**

- No user table. Identity is the email address; the stored identifier is
  its SHA-256 hash.
- Session state is a signed cookie, not a database row.
- Magic-link tokens are stored only as hashes, expire after 15 minutes,
  and are single-use.
- No file uploads, no chat, no message history. The schema holds no
  personal attribute beyond the contact address a listing exists to show.
- **No coordinates are stored at all.** `location` is one of twenty place
  names; the coordinates behind them are a constant of the code. A GPS fix
  is reduced to a place name inside the browser callback that produced it,
  and no coordinate is ever written to the database, put in a URL, or
  logged.
- **The location field is a closed set, not free text.** A dropdown in the
  UI and `z.enum(PLACES)` on the server, so a street, a house number or a
  pasted coordinate pair cannot be entered as a location even deliberately.
  This closed the one remaining way a precise position could reach the
  database: the author typing one.

**Storage limitation (Art. 5(1)(e)).** Retention is bounded for every
stored datum:

| Data | Retention |
|------|-----------|
| Magic-link token (hash only) | 15 min validity; leftover rows purged ≤ 7 days after expiry |
| Session cookie (signed JWT) | 7 days (`SESSION_TTL_DAYS`); logout clears it immediately |
| IP address in `rate_limits` (abuse prevention, Art. 6(1)(f)) | deleted after 6 hours |
| Listings incl. email address | until edited or deleted by their owner |

Both purges ride along inside the batch that `POST /api/auth/send-link`
was already paying for, so they cost no extra round trip and need no cron.

**Cookies / TDDDG.** Two cookies exist. The HttpOnly session cookie is
strictly necessary for the requested service and therefore exempt from
consent under § 25(2) Nr. 2 TDDDG. The `lang` cookie stores an explicit
language choice the user made themselves, is not used for tracking, and
falls under the same functional exemption. There is no analytics
identifier, no tracking, and no third-party embed — Speed Insights
reports Web Vitals to a same-origin endpoint and stores nothing on the
device. Adding any tracking feature later requires a consent banner
*first*.

**No third-party leakage.** Fonts are downloaded at build time and
self-hosted via `next/font` — no runtime request to Google, which is what
LG München I, 3 O 17493/20 was about. The CSP's `connect-src 'self'`
technically prevents the browser from talking to third parties at all.

**Visibility of the address (Art. 6(1)(b)).** Every listing-rendering page
is behind the three-layer session check. The inserent's address is shown
on the card, but only ever to an authenticated member of the same
university — a closed community rather than the public web. The in-app
*Disclaimer* overlay states this guarantee in five languages, and shows
the accepted address pattern `@(*.)reutlingen-university.de`.

**Processors (Art. 28) and transfers (Chapter V).** The database is hosted
in the EU (Neon, Frankfurt, `eu-central-1`; Neon, Inc. is a Databricks
company, and the project is region-locked to Frankfurt). Application
hosting is on Vercel (EU-US Data Privacy Framework certified), with
functions pinned to `fra1`. Transactional email goes through Brevo
(Sendinblue SAS, Paris — an EU provider). The Art. 28 DPAs with all three
processors **have been accepted**. External hosting on Vercel was
confirmed in advance with university IT operations. As hosting provider,
Vercel processes server log data (IP addresses, request metadata) for
delivery and operational security; this is disclosed in the privacy
notice under Art. 6(1)(f).

**Data-subject rights (Art. 15–21).** Users can edit and delete their own
listings at any time; since no other user record exists, deleting all own
listings removes all stored content tied to the person. Logout clears the
session cookie. The privacy notice names a contact channel for the
remaining rights.

Only standard PostgreSQL features are used — `pg_trgm` is a contrib module
shipped with every distribution. A later migration of the database to
university-operated infrastructure is therefore feasible.

## Roadmap

- [x] Technical concept and data model (Marty Lauterbach)
- [x] Figma reference design integrated into the component layout (Marty Lauterbach)
- [x] Project scaffold (Next.js, TypeScript, App Router, `src/`) (Marty Lauterbach)
- [x] Drizzle schema (single `listings` table) and initial migration (Marty Lauterbach)
- [x] Magic-link authentication with JWT session and per-IP / per-email
      rate limiting (Marty Lauterbach)
- [x] CRUD for listings via Server Actions — create, edit, delete (Marty Lauterbach)
- [x] Auth-gated platform layout and route gate (Marty Lauterbach)
- [x] Session expiry enforced: expired `__Host-session` cookies are correctly
      cleared on the first protected request and the user is redirected to
      `/login` (Marty Lauterbach)
- [x] Marketplace page with mode toggle, tag-derived categories, search,
      and pagination, per the Figma design (Marty Lauterbach)
- [x] `/meine` page for managing own listings, with in-place editing (Marty Lauterbach)
- [x] Apply migrations on Neon and run end-to-end against a real `DATABASE_URL`
      (Marty Lauterbach)
- [x] CSP nonce in the proxy — `'unsafe-inline'` removed from `script-src`
      (Marty Lauterbach)
- [x] Page-level `requireSession()` data-access guard (defense in depth)
      (Marty Lauterbach)
- [x] Public `/datenschutz` (Art. 13 GDPR) and `/impressum` (§ 5 DDG) pages
      (Marty Lauterbach)
- [x] Production stack live at `feedmyfrog.click` — Vercel + Neon Frankfurt +
      Brevo, chained and working (Marty Lauterbach)
- [x] Art. 28 DPAs / terms accepted with Vercel, Neon, and Brevo
      (Marty Lauterbach)
- [x] Server-side pagination and search — URL-driven filters, SQL
      `ILIKE`/`@>`/`LIMIT`/`OFFSET`, DB-aggregated category tabs
      (Marty Lauterbach)
- [x] Location filter: radius search over a closed place set,
      privacy-preserving GPS snapping (Marty Lauterbach)
- [x] Location reduced to a closed set — dropdown instead of free text,
      coordinate columns dropped from the database (Marty Lauterbach)
- [x] Server-resolved i18n in five languages, incl. legal pages and
      transactional email (Marty Lauterbach, Kathrin Neu)
- [x] Unit test suite (348 tests) and GitHub Actions CI (Marty Lauterbach)
- [x] Latency work: query batching, GIN and trigram indexes, `fra1` pinning
      (Marty Lauterbach) — see `docs/PERFORMANCE.md`
- [x] Observability: OpenTelemetry spans, `onRequestError`, Speed Insights
      (Marty Lauterbach)
- [x] AI-crawler policy: `robots.txt` deny-list plus `X-Robots-Tag`
      (Marty Lauterbach)
- [x] `Permissions-Policy` corrected to `geolocation=(self)` — the empty
      allowlist had been disabling the app's own GPS button
- [x] Attacker-insertion audit, and the four findings it produced fixed:
      prototype-chain lookups, the `__Host-` cookie fallback, login CSRF on
      `POST /verify`, and the spoofable rate-limit IP (Marty Lauterbach)
- [ ] Frontend alignment (Busra, Kathrin)
- [ ] Frontend design (Busra, Kathrin)
- [ ] Fill in controller/provider placeholders in `src/i18n/legalResources.ts`
      for `/datenschutz` and `/impressum`
- [ ] Add the platform to the university's record of processing activities
      (Art. 30 GDPR)
- [ ] Cache the category-tab aggregation if the listing count grows — it is
      a full scan per marketplace render (`docs/PERFORMANCE.md`)
- [ ] Browser/E2E test layer
- [ ] Internal pilot
- [ ] Review for migration to university infrastructure

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) (SPDX:
`PolyForm-Noncommercial-1.0.0`).

**Permitted (free of charge):** personal use; research, study, and hobby
projects; charitable organizations; educational institutions; public
research organizations; public safety, health, or environmental protection
organizations; government institutions. A non-profit *Verein* using this
software internally falls inside these categories.

**Not permitted:** any commercial purpose, including a company using the
software for internal business tools, a freelancer using it on a paid
client engagement, or selling it (or a derivative) as a product or
service.

**Patents.** The license includes a Patent Defense clause: anyone who
asserts a patent claim against this software loses their license
immediately. Combined with the public publication of this repository on
GitHub (which establishes prior art), the project's intent is that no
patent should be enforceable against this software or its noncommercial
users.

**Liability.** The software is provided "as is" with no warranty and no
liability, to the maximum extent permitted by law. See section *No
Liability* in the [LICENSE](LICENSE).

## Author

Martin Lauterbach, Reutlingen University, May 2026.

E2E Testing Framework & Cypress Setup: **Meinhard Holzknecht**.

Frontend contributions: Kathrin Neu, Busra Sunanur Arpa. Team WayMakr —
Lauterbach, Holzknecht, Neu, Arpa.
