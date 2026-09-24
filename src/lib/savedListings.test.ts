import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SAVED_LISTINGS_KEY,
  SAVED_LISTING_TTL_MS,
  clearSavedListings,
  hashListingId,
  parseSavedListings,
  sweepSavedListings,
  toggleSavedListing,
} from './savedListings';

const ID = '3f0c1d7e-9b1a-4a55-8f0e-2d6c1b7a9e42';
const NOW = 1_800_000_000_000;

describe('hashListingId', () => {
  it('is a stable 64-character hex SHA-256', async () => {
    const hash = await hashListingId(ID);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashListingId(ID)).toBe(hash);
  });

  it('never contains the id it was computed from', async () => {
    const hash = await hashListingId(ID);

    expect(hash).not.toContain(ID.replace(/-/g, ''));
    expect(await hashListingId(`${ID}x`)).not.toBe(hash);
  });
});

describe('parseSavedListings', () => {
  it('keeps unexpired fingerprints', async () => {
    const hash = await hashListingId(ID);
    const raw = JSON.stringify({ [hash]: NOW - 1000 });

    expect(parseSavedListings(raw, NOW)).toEqual({ [hash]: NOW - 1000 });
  });

  it('drops entries older than the TTL', async () => {
    const hash = await hashListingId(ID);
    const raw = JSON.stringify({ [hash]: NOW - SAVED_LISTING_TTL_MS });

    expect(parseSavedListings(raw, NOW)).toEqual({});
  });

  it('drops entries dated too far in the future', async () => {
    const hash = await hashListingId(ID);
    const raw = JSON.stringify({ [hash]: NOW + SAVED_LISTING_TTL_MS });

    expect(parseSavedListings(raw, NOW)).toEqual({});
  });

  it('rejects plain ids, so the old plaintext format is never trusted', () => {
    expect(parseSavedListings(JSON.stringify({ [ID]: NOW }), NOW)).toEqual({});
  });

  it.each([null, '', 'not json', '[]', '42', 'null', '{"__proto__":1}'])(
    'survives %j',
    (raw) => {
      const store = parseSavedListings(raw, NOW);

      expect(store).toEqual({});
      expect(Object.getPrototypeOf(store)).toBe(Object.prototype);
    },
  );
});

describe('toggleSavedListing', () => {
  it('adds, then removes, without mutating its input', async () => {
    const hash = await hashListingId(ID);
    const empty = {};

    const saved = toggleSavedListing(empty, hash, NOW);
    expect(saved).toEqual({ [hash]: NOW });
    expect(empty).toEqual({});

    expect(toggleSavedListing(saved, hash, NOW + 1)).toEqual({});
    expect(saved).toEqual({ [hash]: NOW });
  });
});

describe('on-disk lifetime', () => {
  const disk = new Map<string, string>();

  beforeEach(() => {
    disk.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => disk.get(k) ?? null,
        setItem: (k: string, v: string) => void disk.set(k, v),
        removeItem: (k: string) => void disk.delete(k),
      },
      dispatchEvent: () => true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sweeps expired entries off disk, keeping live ones', async () => {
    const live = await hashListingId('live');
    const stale = await hashListingId('stale');

    disk.set(
      SAVED_LISTINGS_KEY,
      JSON.stringify({ [live]: NOW - 1000, [stale]: NOW - SAVED_LISTING_TTL_MS }),
    );
    sweepSavedListings(NOW);

    expect(JSON.parse(disk.get(SAVED_LISTINGS_KEY)!)).toEqual({ [live]: NOW - 1000 });
  });

  it('removes the key once nothing is left', async () => {
    const stale = await hashListingId('stale');

    disk.set(SAVED_LISTINGS_KEY, JSON.stringify({ [stale]: 0 }));
    sweepSavedListings(NOW);

    expect(disk.has(SAVED_LISTINGS_KEY)).toBe(false);
  });

  it('never creates the key for someone who has not saved anything', () => {
    sweepSavedListings(NOW);

    expect(disk.size).toBe(0);
  });

  it('clears everything on logout, the legacy plaintext key included', () => {
    disk.set(SAVED_LISTINGS_KEY, '{}');
    disk.set('savedListings', JSON.stringify({ [ID]: NOW }));
    clearSavedListings();

    expect(disk.size).toBe(0);
  });
});
