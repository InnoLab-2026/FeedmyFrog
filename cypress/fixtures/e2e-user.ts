/**
 * The one account the end-to-end run signs in as.
 *
 * Shared by the seed script and the Cypress config so there is a single
 * definition of who the tests are. `userId` is not written down: it is derived
 * the same way `src/app/verify/route.ts` derives it after a real magic link,
 * so the session the tests mint names the same user the seed inserted rows
 * for. A hand-written id would look fine and own nothing.
 */
import { createHash } from 'node:crypto';

export const E2E_EMAIL = 'e2e.tester@reutlingen-university.de';

/** Mirrors userIdFromEmail() in src/lib/auth.ts. */
export function userIdFromEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}

export const E2E_USER_ID = userIdFromEmail(E2E_EMAIL);

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
