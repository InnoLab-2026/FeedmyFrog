import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
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
