import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // The real package throws outside Next's "react-server" resolve
      // condition, which Vitest doesn't set up; swap in its own no-op
      // build (the same one Next uses under that condition) so backend
      // modules that start with `import 'server-only'` load normally.
      'server-only': fileURLToPath(
        new URL('./node_modules/server-only/empty.js', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    /*
     * `cypress/**` too, for the guards *about* the e2e suite rather than in
     * it. The spec files themselves are `.cy.ts` and are Cypress's to run;
     * these are ordinary unit tests that happen to have Cypress as a subject,
     * and they belong in the fast suite that runs on every push.
     */
    include: ['src/**/*.test.ts', 'cypress/**/*.test.ts'],
  },
});
