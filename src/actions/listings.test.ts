import { describe, it, expect, vi, beforeEach } from 'vitest';

// These action branches under test (input validation + id guards) run before
// any database call, so the db mock only needs to exist, not behave.
vi.mock('@/db/client', () => ({ db: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

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

const getSession = vi.fn();
vi.mock('@/lib/session', () => ({ getSession: () => getSession() }));

import { createListing, updateListing, deleteListing } from './listings';

const SESSION = { userId: 'a'.repeat(64), email: 'alice@reutlingen-university.de' };

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  getSession.mockReset();
  getSession.mockResolvedValue(SESSION);
});

describe('createListing', () => {
  it('redirects to /login when there is no session', async () => {
    getSession.mockResolvedValue(null);
    await expect(createListing(null, form({}))).rejects.toMatchObject({ url: '/login' });
  });

  it('returns field errors for invalid input', async () => {
    const res = await createListing(
      null,
      form({ type: 'offer', title: 'ab', description: 'short', location: '' }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.title).toBeTruthy();
      expect(res.errors.description).toBeTruthy();
      expect(res.errors.location).toBeTruthy();
    }
  });

  it('rejects an unknown listing type', async () => {
    const res = await createListing(
      null,
      form({
        type: 'wanted',
        title: 'Valid title',
        description: 'A sufficiently long description.',
        location: 'Reutlingen',
      }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.type).toBeTruthy();
  });
});

describe('updateListing', () => {
  it('redirects to /login when there is no session', async () => {
    getSession.mockResolvedValue(null);
    await expect(updateListing(null, form({}))).rejects.toMatchObject({ url: '/login' });
  });

  it('returns an id error when the listing id is not a uuid', async () => {
    const res = await updateListing(null, form({ id: 'not-a-uuid' }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.id).toEqual(['Invalid listing ID']);
  });

  it('returns field errors for invalid input on a valid id', async () => {
    const res = await updateListing(
      null,
      form({ id: '123e4567-e89b-12d3-a456-426614174000', type: 'offer', title: 'ab' }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.title).toBeTruthy();
  });
});

describe('deleteListing', () => {
  it('redirects to /login when there is no session', async () => {
    getSession.mockResolvedValue(null);
    await expect(deleteListing(form({}))).rejects.toMatchObject({ url: '/login' });
  });

  it('silently no-ops (returns undefined) when the id is not a uuid', async () => {
    await expect(deleteListing(form({ id: 'not-a-uuid' }))).resolves.toBeUndefined();
  });
});
