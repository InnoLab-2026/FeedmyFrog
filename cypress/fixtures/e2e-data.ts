/**
 * What the end-to-end run agrees on, as plain data.
 *
 * Imports nothing, deliberately. Cypress bundles a spec file **for the
 * browser** with webpack, so anything a spec reaches — however indirectly —
 * has to survive that: one `node:crypto` two modules down failed the whole
 * suite with "UnhandledSchemeError: Reading from node:crypto is not handled by
 * plugins" before a single test ran.
 *
 * So the split is by runtime, not by topic. Values both sides need live here.
 * Anything needing Node lives in e2e-user.ts, which only the config and the
 * seed script import, and which a spec must not.
 */

export const E2E_EMAIL = 'e2e.tester@reutlingen-university.de';

/**
 * The cookie the app reads the session out of.
 *
 * `__Host-session`, not `session`: the suite runs against `next build` output
 * served by `next start`, which is production, and `src/lib/session.ts` uses
 * the hardened name there. It has to be set `Secure` with `Path=/` and no
 * `Domain` for the browser to accept the prefix at all — Chrome allows that
 * over plain http because localhost counts as a secure context.
 *
 * Getting this wrong is quiet rather than loud: every authenticated request
 * simply redirects to /login, which reads like the session expired.
 */
export const SESSION_COOKIE = '__Host-session';

/**
 * Listings the seed guarantees. The suite asserts against these by title, so
 * they are deliberately unlike anything a test creates at runtime.
 */
export const SEEDED_LISTINGS = [
  {
    type: 'need' as const,
    title: 'Seeded need: Nachhilfe in Statistik',
    description:
      'A seeded listing the end-to-end suite searches for. Do not rename it without updating the specs.',
    tags: ['Bildung'],
    location: 'Reutlingen',
  },
  {
    type: 'offer' as const,
    title: 'Seeded offer: Umzugshilfe am Wochenende',
    description:
      'A seeded offer-side listing, so switching modes has something to show.',
    tags: ['Transport', 'Wochenende'],
    location: 'Tübingen',
  },
];
