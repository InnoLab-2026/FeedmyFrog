# Best-practice and compliance audit — July 2026

This document records the July 2026 audit of the platform against
(a) current React/Next.js SSR best practice and (b) European data
protection law. Each finding lists the requirement, its source, the
state of the system at audit time, and the action taken. It is the
"double verification" record: column *Verified in code* was checked
against the actual implementation after the changes were applied.

## 1. React SSR / Next.js 16 best practices

The app is a Next.js 16 App Router application, fully server-rendered
(SSR) with a small client-side island for marketplace filtering.

| # | Best practice (2026) | Source | Status at audit | Action | Verified in code |
|---|----------------------|--------|-----------------|--------|------------------|
| S1 | **Defense-in-depth auth in three layers**: the proxy decides who reaches a route, the server component decides who renders, the data layer decides who sees a record. Never rely on middleware/proxy alone (lesson of CVE-2025-29927). | Next.js auth guide; WorkOS 2026 guide | Proxy gate + `(auth)/layout.tsx` backstop existed, but pages used `(await getSession())!` non-null assertions and the marketplace page queried the DB with no own check. | Added `requireSession()` to `src/lib/session.ts` (DAL helper that redirects to `/login`); every DB-reading page in `(auth)` now calls it. Server actions already re-checked the session. | `src/lib/session.ts`, `src/app/(auth)/page.tsx`, `meine/page.tsx`, `meine/[id]/edit/page.tsx` |
| S2 | **Nonce-based CSP** generated per request in `proxy.ts`, `script-src 'nonce-…' 'strict-dynamic'`, no `'unsafe-inline'` for scripts. Requires dynamic rendering of every HTML route. | Next.js CSP guide; CSP Hero / techbytes 2026 | CSP was static in `next.config.ts` with `script-src 'unsafe-inline'` (open roadmap item). | CSP moved to `src/proxy.ts` with a per-request nonce; `next.config.ts` keeps the non-CSP security headers. Dev mode adds `'unsafe-eval'` for HMR only. All HTML routes are dynamically rendered (see S3). | `src/proxy.ts`, `next.config.ts` |
| S3 | Pages served with a nonce must be **dynamically rendered** so the HTML nonce matches the header nonce. | Next.js CSP guide | Marketplace/`meine` pages already `force-dynamic`; login/verify-prompt dynamic via `searchParams`; no custom 404 (static default). | Added `force-dynamic` to the new legal pages and a custom `src/app/not-found.tsx` that reads `headers()` (opts into dynamic rendering). | `src/app/not-found.tsx`, `src/app/datenschutz/page.tsx`, `src/app/impressum/page.tsx` |
| S4 | `server-only` imports on every module touching secrets or the DB. | Next.js data security guide | Already implemented throughout `src/lib` and `src/db`. | None. | `src/lib/*`, `src/db/client.ts` |
| S5 | Mutations as Server Actions (automatic Origin-based CSRF protection); session re-validated inside every action. | Next.js auth guide | Already implemented. | None. | `src/actions/*` |
| S6 | Push the `'use client'` boundary to the leaves; fetch on the server, pass data down. | React Server Components practice guides | Already the architecture (server pages → `Marketplace` client island). | None. | `src/app/(auth)/page.tsx` |
| S7 | Caching: since Next 15/16 fetch defaults to no-store; personalised/auth-gated content should render dynamically, cacheable content via `use cache`/Cache Components. Fetch on the server; filter and paginate in the database, not in the client. | Next.js caching docs; Vercel Academy; App Router pagination guides | Auth-gated pages correctly `force-dynamic`, but the marketplace fetched a 500-row cap and filtered/paginated client-side. | **Closed July 2026:** filters and pagination moved into SQL (`ILIKE` search with escaped wildcards, `tags @>` category filter, `LIMIT`/`OFFSET` with `COUNT(*)` clamping, DB-aggregated category tabs); filter state lives in the URL. Verified end-to-end against a real Postgres 16. | `src/app/(auth)/page.tsx`, `src/components/Marketplace.tsx` |
| S8 | Standard security headers (HSTS, nosniff, frame-ancestors, referrer policy, permissions policy), `poweredByHeader: false`. | Next.js security guides | Already implemented. | Kept in `next.config.ts`; `frame-ancestors 'none'` now delivered via the proxy CSP as well as `X-Frame-Options: DENY`. | `next.config.ts` |

Sources (SSR):

- https://nextjs.org/docs/app/guides/authentication
- https://nextjs.org/docs/app/guides/content-security-policy
- https://workos.com/blog/nextjs-app-router-authentication-guide-2026
- https://www.csphero.com/blog/setting-content-security-policy-nextjs
- https://techbytes.app/posts/nextjs-16-xss-hardening-2026-security-cheat-sheet/
- https://nextjs.org/docs/app/getting-started/caching
- https://makerkit.dev/blog/tutorials/nextjs-when-to-use-ssr

## 2. European data protection law

Applicable framework for a German university platform processing
members' email addresses: **GDPR** (EU 2016/679), the German
**TDDDG** (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz,
successor of the TTDSG since May 2024, §25 governs terminal-equipment
access/cookies) and the German **DDG** (Digitale-Dienste-Gesetz, §5
Impressum duty). The EU Data Act and NIS2 do not create obligations
for this system (no connected products; not an essential entity).

| # | Legal requirement | Source | Status at audit | Action | Verified in code |
|---|-------------------|--------|-----------------|--------|------------------|
| L1 | **Privacy notice (Datenschutzerklärung)**, Art. 13/14 GDPR: controller identity, purposes, legal bases, recipients/processors, retention, data-subject rights, supervisory authority — available at the point of collection. | GDPR Art. 13, 14 | **Missing.** No privacy page existed; email is collected on `/login`. | Added public `/datenschutz` page (controller details as clearly marked placeholders to be filled before pilot), linked from the login page and the footer. | `src/app/datenschutz/page.tsx`, `src/app/login/page.tsx`, `src/components/layout/Footer.tsx` |
| L2 | **Impressum**, §5 DDG (German provider-identification duty for digital services). | DDG §5 | **Missing.** | Added public `/impressum` page (placeholders to be filled before pilot), linked from the footer. | `src/app/impressum/page.tsx`, `src/components/layout/Footer.tsx` |
| L3 | **Cookie consent**, §25 TDDDG: consent required unless storage is *strictly necessary* for the service the user requested. A single HttpOnly session cookie for login is exempt (§25(2) Nr. 2); no banner needed as long as no tracking/analytics/marketing storage is added. | TDDDG §25; DSK guidance | Compliant by design — only the session cookie is set; no analytics, no third-party embeds. Undocumented. | Documented in README and in the privacy notice. Any future analytics requires a consent banner first. | `src/lib/session.ts` (only cookie written) |
| L4 | **No third-party font/CDN leakage** (LG München I, 3 O 17493/20 — Google Fonts): loading fonts from Google transmits IPs unlawfully. | Case law; usercentrics/privacychecker 2026 guides | Compliant: `next/font/google` downloads fonts at build time and self-hosts them; no runtime request to Google. Undocumented. | Documented in README and privacy notice. | `src/app/layout.tsx` |
| L5 | **Processor contracts (AVV/DPA), Art. 28 GDPR** with Vercel (hosting), Neon (DB), Brevo (email). Third-country transfers Chapter V: Vercel is EU-US Data Privacy Framework certified; Neon project pinned to Frankfurt (`eu-central-1`); Brevo is an EU (French) provider. | GDPR Art. 28, 44 ff.; Vercel DPA/changelog; Brevo GDPR docs | DB region was documented; DPA duty was not. | Documented in README and listed all three processors in the privacy notice with legal entities (Vercel Inc., USA/DPF; Neon, Inc. — a Databricks company, DB region-locked to Frankfurt; Brevo/Sendinblue SAS, Paris). **Closed July 2026: terms and DPAs of all three platforms accepted; stack live at `feedmyfrog.click`.** | README §Data protection, `src/app/datenschutz/page.tsx` |
| L10 | **Hosting log data must be disclosed** (Art. 13 GDPR): Vercel automatically processes server logs — end-user IP addresses, request metadata, IP-derived location — to deliver and secure customer sites. | Vercel privacy notice | Undisclosed (platform went live). | Added a *Server-Logdaten* item to the privacy notice (Art. 6(1)(f), no profiling) and a Hosting section to the Impressum naming Vercel, Neon, and Brevo. | `src/app/datenschutz/page.tsx`, `src/app/impressum/page.tsx` |
| L6 | **Data minimisation / storage limitation**, Art. 5(1)(c)+(e) GDPR: collect only what is needed, keep it no longer than needed. | GDPR Art. 5 | Largely compliant: no user table, `sha256(email)` identifier, hashed single-use tokens (15 min TTL, purged ≤ 7 days after expiry), rate-limit rows (contain IPs) purged after 6 h, session cookie 7 days. Retention was undocumented. | Documented as a retention table in README and privacy notice. | `src/app/api/auth/send-link/route.ts` (token + rate-limit purge), `src/lib/rate-limit.ts` |
| L7 | **IP addresses are personal data** (CJEU C-582/14 Breyer): rate-limit keys `send-link:ip:<ip>` are personal data; processing is justified by Art. 6(1)(f) (abuse prevention) and must be time-limited. | CJEU C-582/14 | Purged after 6 hours; undocumented. | Documented; 6-hour retention confirmed in `cleanupRateLimits()`. | `src/lib/rate-limit.ts` |
| L8 | **Data-subject rights**, Art. 15–21 GDPR: access, rectification, erasure, restriction, portability, objection. | GDPR Art. 15–21 | Users can edit and delete their own listings; logout clears the session. Erasure of everything tied to an email is possible by deleting all own listings (no other user record exists). No documented contact channel. | Rights and the contact channel documented in the privacy notice; README updated. | `src/actions/listings.ts` |
| L9 | **Visibility of the email address**: shown to authenticated members of the same university only; disclosure basis Art. 6(1)(b) (the contact address is the purpose of a listing). | GDPR Art. 6(1)(b) | Implemented (auth-gated everywhere) and stated in the in-app disclaimer in five languages. | Restated in the privacy notice; page-level `requireSession()` (S1) strengthens the technical guarantee. | `src/app/(auth)/*` |

Sources (EU law):

- https://gemprogrammers.com/cookie-banner-compliance-germany-ttdsg/
- https://next-levels.de/en/blog/cookies-consent-and-tdddg-legally-compliant-tracking
- https://usercentrics.com/knowledge-hub/google-fonts-gdpr-compliant/
- https://privacychecker.pro/blog/google-fonts-gdpr-compliant
- https://allaboutberlin.com/guides/website-compliance-germany
- https://vercel.com/legal/dpa and https://vercel.com/changelog/vercel-is-now-certified-under-the-eu-us-data-privacy-framework-dpf
- https://vercel.com/legal/privacy-notice (log data: IP addresses, IP-derived location, traffic metadata)
- https://help.brevo.com/hc/en-us/articles/360001258744-How-does-Brevo-comply-with-the-GDPR
- https://www.brevo.com/legal/notice/ (legal entity: Sendinblue SAS, 17 rue Salneuve, 75017 Paris; German office Brevo GmbH, Köpenicker Str. 126, 10179 Berlin)
- https://www.databricks.com/blog/databricks-neon (Neon, Inc. acquired by Databricks, 2025)

## 3. Open organisational items (not code)

These cannot be closed by code and must be done before the internal pilot:

1. Fill in the controller/provider identity placeholders in
   `/datenschutz` and `/impressum` (name, address, contact of the
   responsible person or institution, and the university's data
   protection officer).
2. ~~Sign/accept the Art. 28 DPAs: Vercel, Neon, Brevo.~~ **Done
   (July 2026)** — terms and DPAs accepted on all three platforms; the
   production stack is live at `feedmyfrog.click`.
3. Add the platform to the university's record of processing
   activities (Art. 30 GDPR) — the retention table in the README is
   the input for that record.
4. If analytics, embedded media, or any other third-party storage is
   ever added: implement a §25 TDDDG consent banner *first*.
