import { describe, expect, it } from 'vitest';

import { UnsafeEndpointError, resolveFetchEndpoint } from './httpEndpoint';

/*
 * The rules that keep a test-only convenience from ever becoming a way to
 * read production's traffic.
 *
 * Whoever controls the fetch endpoint sees every query the app makes and
 * writes every answer it gets back, so "it is only used by the e2e suite" is
 * not a property of the code unless something enforces it. These are that
 * something.
 */
describe('resolveFetchEndpoint', () => {
  it('leaves the driver alone when nothing asks otherwise', () => {
    expect(resolveFetchEndpoint({})).toBeUndefined();
    expect(resolveFetchEndpoint({ NEON_HTTP_ENDPOINT: '' })).toBeUndefined();
  });

  it('accepts a loopback endpoint', () => {
    for (const host of ['127.0.0.1', 'localhost', '[::1]']) {
      expect(
        resolveFetchEndpoint({ NEON_HTTP_ENDPOINT: `http://${host}:5433/sql` }),
      ).toContain(host);
    }
  });

  it('refuses outright on a Vercel deployment, however local it looks', () => {
    /*
     * The decisive rule. A deployed app has no legitimate reason to redirect
     * its own database traffic, so on Vercel the value is not examined on its
     * merits at all -- even the address the e2e suite legitimately uses is
     * rejected there.
     */
    expect(() =>
      resolveFetchEndpoint({
        NEON_HTTP_ENDPOINT: 'http://127.0.0.1:5433/sql',
        VERCEL: '1',
      }),
    ).toThrow(UnsafeEndpointError);

    expect(() =>
      resolveFetchEndpoint({
        NEON_HTTP_ENDPOINT: 'http://127.0.0.1:5433/sql',
        VERCEL: '1',
        VERCEL_ENV: 'production',
      }),
    ).toThrow(/Refusing to start/);
  });

  it.each([
    ['a host somebody else controls', 'https://evil.example.com/sql'],
    ['an IP that is not loopback', 'http://203.0.113.10:5433/sql'],
    ['a host that merely looks local', 'http://localhost.evil.example.com/sql'],
    ['a subdomain of loopback', 'http://127.0.0.1.evil.example.com/sql'],
    ['the metadata service', 'http://169.254.169.254/sql'],
    ['a private address on another machine', 'http://10.0.0.5:5433/sql'],
  ])('refuses %s', (_label, endpoint) => {
    expect(() => resolveFetchEndpoint({ NEON_HTTP_ENDPOINT: endpoint })).toThrow(
      UnsafeEndpointError,
    );
  });

  it('refuses a non-http scheme', () => {
    expect(() =>
      resolveFetchEndpoint({ NEON_HTTP_ENDPOINT: 'file:///etc/passwd' }),
    ).toThrow(UnsafeEndpointError);
  });

  it('refuses an endpoint carrying credentials', () => {
    expect(() =>
      resolveFetchEndpoint({
        NEON_HTTP_ENDPOINT: 'http://user:pass@127.0.0.1:5433/sql',
      }),
    ).toThrow(/credentials/);
  });

  it('refuses something that is not a URL rather than ignoring it', () => {
    // Silently falling back would leave an operator believing the override
    // took effect. Every rejection here stops the process instead.
    expect(() =>
      resolveFetchEndpoint({ NEON_HTTP_ENDPOINT: 'not-a-url' }),
    ).toThrow(UnsafeEndpointError);
  });
});
