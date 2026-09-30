import { defineConfig } from 'cypress';
import { SignJWT } from 'jose';

import { E2E_EMAIL, E2E_USER_ID } from './cypress/fixtures/e2e-user';

/**
 * Signing a session inside the runner, rather than asking the app for one.
 *
 * The app has no endpoint that hands out a session, and it must not grow one:
 * a route that mints a valid cookie for an unauthenticated GET is an
 * authentication bypass wherever it is reachable, and "reachable" is decided
 * by an environment variable rather than by anything in the code. The
 * capability belongs here instead, in a Node process that already holds
 * AUTH_SECRET, with no HTTP surface for anyone to find.
 *
 * The payload has to satisfy the `Payload` schema in src/lib/session.ts, and
 * the cookie name is the development one -- `session`, not `__Host-session`,
 * which the app only uses when NODE_ENV is production and which the browser
 * would refuse over plain http anyway.
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 1, openMode: 0 },
    env: {
      E2E_EMAIL,
      E2E_USER_ID,
    },
    setupNodeEvents(on) {
      on('task', {
        async mintSession({
          userId = E2E_USER_ID,
          email = E2E_EMAIL,
        }: {
          userId?: string;
          email?: string;
        } = {}) {
          const secret = process.env.AUTH_SECRET;

          if (!secret) {
            throw new Error(
              'AUTH_SECRET is not set. The e2e run needs the same secret the ' +
                'app under test was started with, or the cookie it signs will ' +
                'not verify.',
            );
          }

          return new SignJWT({ userId, email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(new TextEncoder().encode(secret));
        },
      });
    },
  },
});
