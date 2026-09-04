import { beforeEach, describe, expect, it, vi } from 'vitest';

// Transitively imported via @/lib/validators; stub it so the real env.ts
// (which requires a full, valid process.env) never has to run in tests.
vi.mock('@/lib/env', () => ({
  env: { ALLOWED_EMAIL_DOMAIN: 'reutlingen-university.de' },
}));

const getSessionMock = vi.fn();
vi.mock('@/lib/session', () => ({ getSession: getSessionMock }));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

const revalidatePathMock = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

const insertValues = vi.fn().mockResolvedValue(undefined);
const returningMock = vi.fn();
const updateWhere = vi.fn(() => ({ returning: returningMock }));
const updateSet = vi.fn(() => ({ where: updateWhere }));
const deleteWhere = vi.fn().mockResolvedValue(undefined);

vi.mock('@/db/client', () => ({
  db: {
    insert: () => ({ values: insertValues }),
    update: () => ({ set: updateSet }),
    delete: () => ({ where: deleteWhere }),
  },
}));

const { createListing, updateListing, deleteListing } = await import('./listings');

const SESSION = { userId: 'a'.repeat(64), email: 'anna@reutlingen-university.de' };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const validFields = {
  type: 'offer',
  title: 'Nachhilfe in Mathematik',
  description: 'Biete Nachhilfe fuer Analysis und lineare Algebra.',
  tags: 'Bildung,Nachhilfe',
  location: 'Reutlingen',
};

beforeEach(() => {
  getSessionMock.mockReset();
  redirectMock.mockClear();
  revalidatePathMock.mockClear();
  insertValues.mockClear();
  updateSet.mockClear();
  updateWhere.mockClear();
  returningMock.mockReset();
  deleteWhere.mockClear();
});

describe('createListing', () => {
  it('redirects to /login when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(createListing(null, formData({}))).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(insertValues).not.toHaveBeenCalled();
  });

  it('returns standardized error codes (not prose) and does not insert on invalid input', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    const result = await createListing(
      null,
      formData({ type: 'need', title: 'ab', description: 'too short', location: '' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toEqual(['title_too_short']);
      expect(result.errors.description).toEqual(['description_too_short']);
      expect(result.errors.location).toEqual(['location_required']);
    }
    expect(insertValues).not.toHaveBeenCalled();
  });

  it('parses the comma-separated tags field into an array', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    await expect(createListing(null, formData(validFields))).resolves.toEqual({ ok: true });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['Bildung', 'Nachhilfe'] }),
    );
  });

  it('stores coordinates for a location it can place, so the radius filter finds it', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    await expect(
      createListing(null, formData({ ...validFields, location: '72762 Reutlingen' })),
    ).resolves.toEqual({ ok: true });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 48.4914, lng: 9.2042 }),
    );
  });

  it('stores null coordinates rather than guessing at an unknown location', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    await expect(
      createListing(null, formData({ ...validFields, location: 'bei mir zu Hause' })),
    ).resolves.toEqual({ ok: true });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ lat: null, lng: null }),
    );
  });

  it('scopes the insert to the session user, revalidates, and reports success', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    await expect(createListing(null, formData(validFields))).resolves.toEqual({ ok: true });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: SESSION.userId, email: SESSION.email }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
    expect(revalidatePathMock).toHaveBeenCalledWith('/meine');
  });
});

describe('updateListing', () => {
  const VALID_ID = '123e4567-e89b-12d3-a456-426614174000';

  it('redirects to /login when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(updateListing(null, formData({ id: VALID_ID }))).rejects.toThrow(
      'NEXT_REDIRECT:/login',
    );
  });

  it('rejects a malformed id with the invalid_id code, without touching the db', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    const result = await updateListing(null, formData({ id: 'not-a-uuid', ...validFields }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.id).toEqual(['invalid_id']);
    expect(updateSet).not.toHaveBeenCalled();
  });

  it('returns standardized error codes for invalid input', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    const result = await updateListing(
      null,
      formData({ id: VALID_ID, type: 'need', title: 'x', description: 'short', location: '' }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toEqual(['title_too_short']);
      expect(result.errors.location).toEqual(['location_required']);
    }
  });

  it('reports the not_found code when the update matches no row (wrong owner or missing)', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    returningMock.mockResolvedValue([]);

    const result = await updateListing(null, formData({ id: VALID_ID, ...validFields }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.id).toEqual(['not_found']);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('re-resolves coordinates on update so a moved listing is filtered correctly', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    returningMock.mockResolvedValue([{ id: VALID_ID }]);

    await expect(
      updateListing(null, formData({ id: VALID_ID, ...validFields, location: 'Stuttgart' })),
    ).rejects.toThrow('NEXT_REDIRECT:/meine');

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ lat: 48.7758, lng: 9.1829 }),
    );
  });

  it('clears stale coordinates when the location becomes unplaceable', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    returningMock.mockResolvedValue([{ id: VALID_ID }]);

    await expect(
      updateListing(null, formData({ id: VALID_ID, ...validFields, location: 'Hamburg' })),
    ).rejects.toThrow('NEXT_REDIRECT:/meine');

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({ lat: null, lng: null }),
    );
  });

  it('redirects to /meine and revalidates on a successful update', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    returningMock.mockResolvedValue([{ id: VALID_ID }]);

    await expect(updateListing(null, formData({ id: VALID_ID, ...validFields }))).rejects.toThrow(
      'NEXT_REDIRECT:/meine',
    );

    expect(revalidatePathMock).toHaveBeenCalledWith('/');
    expect(revalidatePathMock).toHaveBeenCalledWith('/meine');
  });
});

describe('deleteListing', () => {
  const VALID_ID = '123e4567-e89b-12d3-a456-426614174000';

  it('redirects to /login when unauthenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    await expect(deleteListing(formData({ id: VALID_ID }))).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it('silently no-ops on a malformed id', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    await deleteListing(formData({ id: 'not-a-uuid' }));
    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it('deletes and revalidates on a valid id', async () => {
    getSessionMock.mockResolvedValue(SESSION);
    await deleteListing(formData({ id: VALID_ID }));

    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/');
    expect(revalidatePathMock).toHaveBeenCalledWith('/meine');
  });
});
