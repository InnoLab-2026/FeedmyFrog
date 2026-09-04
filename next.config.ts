import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // `geolocation=(self)`, not `()`: an empty allowlist disables the API for
  // this document as well as for embedded frames, which would block the
  // "Use GPS location" button in src/components/marketplace/LocationSearch.tsx
  // — the app's own feature, refused by the app's own header. `(self)` keeps
  // every third-party frame out while leaving the top-level document able to
  // ask. The browser's own permission prompt is still the gate the user sees,
  // and the fix is only ever asked for on a click.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
  // AI/LLM opt-out signal. `noai`/`noimageai` ask crawlers not to use the
  // content for training or generative answers; honoured by a growing set of
  // AI crawlers and complements the user-agent rules in src/app/robots.ts.
  { key: 'X-Robots-Tag', value: 'noai, noimageai' },
  // The Content-Security-Policy is NOT set here: it carries a per-request
  // nonce and is therefore built in src/proxy.ts.
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default config;
