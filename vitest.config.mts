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
    include: ['src/**/*.test.ts'],
  },
});
