import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    // Deterministic environment for modules that validate `process.env` at
    // import time (`src/lib/env.ts`). These are throwaway test values; no real
    // secrets are involved, so nothing here needs to live in CI secrets.
    env: {
      DATABASE_URL: 'postgres://user:pass@localhost:5432/test',
      AUTH_SECRET: 'a'.repeat(64),
      MAGIC_LINK_TTL_MINUTES: '15',
      SESSION_TTL_DAYS: '7',
      BREVO_API_KEY: 'xkeysib-test-key',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_INSTITUTION_DOMAIN: 'reutlingen-university.de',
      ALLOWED_EMAIL_DOMAIN: 'reutlingen-university.de',
      RATE_LIMIT_SEND_LINK_PER_IP: '10',
      RATE_LIMIT_SEND_LINK_PER_EMAIL: '5',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/actions/**'],
    },
  },
  resolve: {
    alias: {
      // Neutralise `import 'server-only'` in unit tests.
      'server-only': fileURLToPath(new URL('./test/stubs/server-only.ts', import.meta.url)),
      // Mirror the `@/*` -> `src/*` path alias from tsconfig.json.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
