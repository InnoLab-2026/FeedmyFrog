import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory cookie jar backing the mocked `next/headers` cookies().
const jar = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
}));

// `redirect()` throws in real Next.js to halt rendering; mimic that so callers
// that hit the guard do not fall through.
class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
}));

import {
  createSession,
  getSession,
  requireSession,
  destroySession,
  SESSION_COOKIE,
  type Session,
} from './session';

const sample: Session = {
  userId: 'a'.repeat(64),
  email: 'alice@reutlingen-university.de',
};

beforeEach(() => {
  jar.clear();
});

describe('SESSION_COOKIE', () => {
  it('is the non-__Host- name outside production', () => {
    // NODE_ENV is "test" in the vitest env config.
    expect(SESSION_COOKIE).toBe('session');
  });
});

describe('createSession / getSession', () => {
  it('round-trips a session through a signed cookie', async () => {
    await createSession(sample);
    expect(jar.get(SESSION_COOKIE)).toBeTruthy();
    const restored = await getSession();
    expect(restored).toEqual(sample);
  });

  it('returns null when no cookie is present', async () => {
    expect(await getSession()).toBeNull();
  });

  it('returns null for a tampered JWT', async () => {
    await createSession(sample);
    const jwt = jar.get(SESSION_COOKIE)!;
    // Flip the last character of the signature.
    const tampered = jwt.slice(0, -1) + (jwt.at(-1) === 'a' ? 'b' : 'a');
    jar.set(SESSION_COOKIE, tampered);
    expect(await getSession()).toBeNull();
  });

  it('returns null for a garbage cookie value', async () => {
    jar.set(SESSION_COOKIE, 'not.a.jwt');
    expect(await getSession()).toBeNull();
  });

  it('reads a legacy "session" cookie as a fallback', async () => {
    await createSession(sample);
    const jwt = jar.get(SESSION_COOKIE)!;
    jar.clear();
    jar.set('session', jwt);
    expect(await getSession()).toEqual(sample);
  });
});

describe('requireSession', () => {
  it('returns the session when authenticated', async () => {
    await createSession(sample);
    expect(await requireSession()).toEqual(sample);
  });

  it('redirects to /login when unauthenticated', async () => {
    await expect(requireSession()).rejects.toMatchObject({ url: '/login' });
  });
});

describe('destroySession', () => {
  it('removes both the current and legacy cookies', async () => {
    await createSession(sample);
    jar.set('session', 'legacy');
    await destroySession();
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(jar.has('session')).toBe(false);
    expect(await getSession()).toBeNull();
  });
});
