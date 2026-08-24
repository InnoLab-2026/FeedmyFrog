import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    AUTH_SECRET: 'a'.repeat(64),
    SESSION_TTL_DAYS: 7,
    NODE_ENV: 'development',
  },
}));

// A minimal in-memory stand-in for Next's cookies() store — only the
// get/set/delete surface that src/lib/session.ts actually calls.
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

vi.mock('next/headers', () => ({
  cookies: async () => cookiesApi,
}));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

const { createSession, getSession, requireSession, destroySession, SESSION_COOKIE } =
  await import('./session');

describe('session', () => {
  beforeEach(() => {
    store.clear();
    redirectMock.mockClear();
  });

  it('round-trips a session through createSession -> getSession', async () => {
    await createSession({
      userId: 'a'.repeat(64),
      email: 'anna@reutlingen-university.de',
    });

    const session = await getSession();
    expect(session).toEqual({
      userId: 'a'.repeat(64),
      email: 'anna@reutlingen-university.de',
    });
  });

  it('returns null when there is no session cookie', async () => {
    expect(await getSession()).toBeNull();
  });

  it('returns null for a tampered/invalid JWT', async () => {
    store.set(SESSION_COOKIE, 'not-a-valid-jwt');
    expect(await getSession()).toBeNull();
  });

  it('returns null when the payload fails the userId/email shape check', async () => {
    // Sign a token with the same secret but a payload that violates the
    // Payload schema (userId must be 64 lowercase hex chars).
    const { SignJWT } = await import('jose');
    const jwt = await new SignJWT({ userId: 'not-64-hex-chars', email: 'anna@reutlingen-university.de' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode('a'.repeat(64)));

    store.set(SESSION_COOKIE, jwt);
    expect(await getSession()).toBeNull();
  });

  it('destroySession removes the cookie so getSession returns null again', async () => {
    await createSession({ userId: 'b'.repeat(64), email: 'ben@reutlingen-university.de' });
    expect(await getSession()).not.toBeNull();

    await destroySession();
    expect(await getSession()).toBeNull();
  });

  it('requireSession returns the session when present', async () => {
    await createSession({ userId: 'c'.repeat(64), email: 'clara@reutlingen-university.de' });
    const session = await requireSession();
    expect(session.email).toBe('clara@reutlingen-university.de');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('requireSession redirects to /login when there is no session', async () => {
    await expect(requireSession()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
