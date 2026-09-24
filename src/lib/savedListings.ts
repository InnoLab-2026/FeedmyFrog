/*
 * Saved ("bookmarked") listings, kept in the browser only.
 *
 * What lands in localStorage is a map from a SHA-256 fingerprint of the
 * listing's row id to the time it was saved -- never the listing itself.
 * Listings carry real names, e-mail addresses and personal circumstances,
 * and a copy of them in localStorage would sit unencrypted on every device
 * that ever saved one, outliving deletion on our side for as long as the
 * browser keeps it (DSGVO Art. 5(1)(c) and (e)). A fingerprint is useless
 * without the listing it was computed from, which only an authenticated
 * page ever has.
 *
 * Nothing here talks to the server. The saved view shows the saved listings
 * among those the marketplace has already received, so saving adds no query
 * and no route.
 */

export const SAVED_LISTINGS_KEY = 'savedListings.v2';

/** The first draft stored plain row ids under this key; it is only removed. */
export const LEGACY_SAVED_LISTINGS_KEY = 'savedListings';

/** Same-tab change signal; other tabs hear the native `storage` event. */
export const SAVED_LISTINGS_EVENT = 'saved-listings-change';

export const SAVED_LISTING_TTL_DAYS = 7;
export const SAVED_LISTING_TTL_MS = SAVED_LISTING_TTL_DAYS * 24 * 60 * 60 * 1000;

// Domain separation: the fingerprint of a listing id here is not the SHA-256
// of the bare id, so it cannot be matched against any other hash of it.
const HASH_DOMAIN = 'feedmyfrog:saved-listing:v1:';

const HASH_PATTERN = /^[0-9a-f]{64}$/;

/** Fingerprint -> ms timestamp it was saved at. */
export type SavedListingStore = Record<string, number>;

export async function hashListingId(id: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(HASH_DOMAIN + id),
  );

  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

/*
 * localStorage is input like any other: another script, an older build or a
 * hand edit may have put anything there. Only well-formed, unexpired entries
 * survive, so expiry needs no separate sweep -- the next write drops them.
 * The pattern check also keeps a `__proto__` key out of the plain object.
 */
export function parseSavedListings(
  raw: string | null,
  now: number,
): SavedListingStore {
  if (!raw) return {};

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {};
  }

  const store: SavedListingStore = {};

  for (const [hash, savedAt] of Object.entries(parsed)) {
    if (
      HASH_PATTERN.test(hash) &&
      typeof savedAt === 'number' &&
      Number.isFinite(savedAt) &&
      // abs(): a clock set back must not make an entry immortal.
      Math.abs(now - savedAt) < SAVED_LISTING_TTL_MS
    ) {
      store[hash] = savedAt;
    }
  }

  return store;
}

/** Returns a new store with `hash` added (at `now`) or removed. */
export function toggleSavedListing(
  store: SavedListingStore,
  hash: string,
  now: number,
): SavedListingStore {
  const next = { ...store };

  if (hash in next) delete next[hash];
  else next[hash] = now;

  return next;
}

// Every access is guarded: storage throws in some private modes and when
// site data is blocked, and saving is a convenience, never a requirement.

export function readSavedListingsRaw(): string | null {
  try {
    return window.localStorage.getItem(SAVED_LISTINGS_KEY);
  } catch {
    return null;
  }
}

export function writeSavedListings(store: SavedListingStore): void {
  try {
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(SAVED_LISTINGS_KEY);
    } else {
      window.localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(store));
    }

    window.dispatchEvent(new Event(SAVED_LISTINGS_EVENT));
  } catch {
    // Storage unavailable: the toggle simply does not stick.
  }
}

/** Called on logout, so the next person at a shared machine starts clean. */
export function clearSavedListings(): void {
  try {
    window.localStorage.removeItem(SAVED_LISTINGS_KEY);
    window.localStorage.removeItem(LEGACY_SAVED_LISTINGS_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
