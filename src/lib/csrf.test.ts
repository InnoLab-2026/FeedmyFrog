import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_BASE_URL: 'https://feedmyfrog.click' },
}));

const { isSameOriginRequest } = await import('./csrf');

function request(headers: Record<string, string>): Request {
  return new Request('https://feedmyfrog.click/verify', {
    method: 'POST',
    headers,
  });
}

describe('isSameOriginRequest', () => {
  it('allows the app’s own form post', () => {
    expect(isSameOriginRequest(request({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
  });

  it('allows a request with no initiator (typed URL, bookmark)', () => {
    expect(isSameOriginRequest(request({ 'sec-fetch-site': 'none' }))).toBe(true);
  });

  it('refuses a cross-site form post — the login-CSRF case', () => {
    expect(isSameOriginRequest(request({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
  });

  it('refuses a subdomain, which __Host- already refuses for the cookie', () => {
    expect(isSameOriginRequest(request({ 'sec-fetch-site': 'same-site' }))).toBe(false);
  });

  it('trusts Sec-Fetch-Site over Origin when both are present', () => {
    // Origin is attacker-settable outside a browser; Sec-Fetch-Site is not.
    expect(
      isSameOriginRequest(
        request({ 'sec-fetch-site': 'cross-site', origin: 'https://feedmyfrog.click' }),
      ),
    ).toBe(false);
  });

  describe('fallback for browsers without Sec-Fetch-Site', () => {
    it('allows the configured origin', () => {
      expect(isSameOriginRequest(request({ origin: 'https://feedmyfrog.click' }))).toBe(true);
    });

    it('refuses another origin', () => {
      expect(isSameOriginRequest(request({ origin: 'https://evil.example' }))).toBe(false);
    });

    it('refuses a look-alike host', () => {
      expect(
        isSameOriginRequest(request({ origin: 'https://feedmyfrog.click.evil.example' })),
      ).toBe(false);
      expect(isSameOriginRequest(request({ origin: 'https://evil-feedmyfrog.click' }))).toBe(false);
    });

    it('refuses the same host on another scheme or port', () => {
      expect(isSameOriginRequest(request({ origin: 'http://feedmyfrog.click' }))).toBe(false);
      expect(isSameOriginRequest(request({ origin: 'https://feedmyfrog.click:8443' }))).toBe(false);
    });

    it('refuses a subdomain', () => {
      expect(isSameOriginRequest(request({ origin: 'https://sub.feedmyfrog.click' }))).toBe(false);
    });

    it('refuses "null" and other unparsable origins without throwing', () => {
      expect(isSameOriginRequest(request({ origin: 'null' }))).toBe(false);
      expect(isSameOriginRequest(request({ origin: 'not a url' }))).toBe(false);
      expect(isSameOriginRequest(request({ origin: '' }))).toBe(false);
    });
  });

  it('refuses a request carrying neither header', () => {
    expect(isSameOriginRequest(request({}))).toBe(false);
  });
});
