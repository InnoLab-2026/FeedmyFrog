/**
 * The identity the end-to-end run signs in as. **Node side only.**
 *
 * A spec must not import this. Cypress compiles spec files for the browser,
 * and `node:crypto` below cannot be bundled — importing it from a spec fails
 * the whole file at compile time, before any test runs. Specs import
 * `e2e-data.ts`; this is for `cypress.config.ts` and `scripts/seed-e2e.ts`,
 * both of which are plain Node.
 *
 * `userId` is derived rather than written down: the same way
 * `src/app/verify/route.ts` derives it after a real magic link, so the session
 * the tests mint names the same user the seed inserted rows for. A
 * hand-written id would look fine and own nothing.
 */
import { createHash } from 'node:crypto';

import { E2E_EMAIL } from './e2e-data';

export { E2E_EMAIL, SESSION_COOKIE, SEEDED_LISTINGS } from './e2e-data';

/** Mirrors userIdFromEmail() in src/lib/auth.ts. */
export function userIdFromEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}

export const E2E_USER_ID = userIdFromEmail(E2E_EMAIL);
