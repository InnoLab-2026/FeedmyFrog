import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';

/*
 * The same session module, but loaded as it behaves in production. Kept in its
 * own file because NODE_ENV is read at import time and decides the cookie name.
 */
const AUTH_SECRET = 'a'.repeat(64);

vi.mock('@/lib/env', () => ({
  env: {
    AUTH_SECRET: 'a'.repeat(64),
    SESSION_TTL_DAYS: 7,
    NODE_ENV: 'production',
  },
}));

const store = new Map<string, string>();
const cookiesApi = {
  get: (name: string) => (store.has(name) ? { value: store.get(name)! } : undefined),
  set: (name: string, value: string) => {
    store.set(name, value);
  },
  delete: (name: string) => {
    store.delete(name);
  },
};

vi.mock('next/headers', () => ({ cookies: async () => cookiesApi }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

const { createSession, getSession, SESSION_COOKIE } = await import('./session');

const SESSION = { userId: 'a'.repeat(64), email: 'anna@reutlingen-university.de' };

describe('production cookie name', () => {
  beforeEach(() => store.clear());

  it('is the __Host- prefixed one', () => {
    expect(SESSION_COOKIE).toBe('__Host-session');
  });

  it('accepts a session under the prefixed name', async () => {
    await createSession(SESSION);

    expect(store.has('__Host-session')).toBe(true);
    await expect(getSession()).resolves.toEqual(SESSION);
  });

  /*
   * The regression this file exists for.
   *
   * `__Host-` guarantees that only the exact host could have set the cookie —
   * a subdomain cannot. Reading a plain `session` as a fallback threw that
   * away: anything able to write a cookie for the parent domain (an XSS on
   * any subdomain, a sibling app) could plant a validly-signed session of its
   * own and fix a reader into someone else's account.
   */
  it('ignores a validly-signed session under the unprefixed name', async () => {
    await createSession(SESSION);

    const jwt = store.get('__Host-session')!;
    store.clear();
    store.set('session', jwt);

    await expect(getSession()).resolves.toBeNull();
  });

  it('ignores a session under any other name', async () => {
    await createSession(SESSION);

    const jwt = store.get('__Host-session')!;
    store.clear();

    for (const name of ['Host-session', '__host-session', '__Host-Session', 'sess']) {
      store.clear();
      store.set(name, jwt);
      await expect(getSession(), name).resolves.toBeNull();
    }
  });
});

describe('the verification algorithm is pinned', () => {
  beforeEach(() => store.clear());

  it('refuses a token signed with a different HMAC algorithm', async () => {
    // Correctly signed with the real secret — only `alg` differs. Without
    // `algorithms: ['HS256']` the header would choose, and this would verify.
    const hs512 = await new SignJWT(SESSION)
      .setProtectedHeader({ alg: 'HS512' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(AUTH_SECRET));

    store.set('__Host-session', hs512);

    await expect(getSession()).resolves.toBeNull();
  });

  it('still accepts the HS256 token the app itself issues', async () => {
    await createSession(SESSION);
    await expect(getSession()).resolves.toEqual(SESSION);
  });
});
