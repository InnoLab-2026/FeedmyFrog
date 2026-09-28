'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import type { Listing } from '@/types';
import {
  LEGACY_SAVED_LISTINGS_KEY,
  SAVED_LISTINGS_EVENT,
  hashListingId,
  parseSavedListings,
  readSavedListingsRaw,
  sweepSavedListings,
  toggleSavedListing,
  writeSavedListings,
} from '@/lib/savedListings';

interface KnownListing {
  listing: Listing;
  hash: string;
}

interface SavedListingsContextValue {
  isSaved: (id: string) => boolean;
  toggleSaved: (listing: Listing) => void;
  /** Hands the listings a page received to the saved view. */
  rememberListings: (listings: Listing[]) => void;
  /** Saved listings this tab has seen, most recently saved first. */
  savedListings: Listing[];
  /** Some fingerprints match nothing seen yet in this tab. */
  hasUnresolved: boolean;
}

const SavedListingsContext = createContext<SavedListingsContextValue | null>(
  null,
);

function subscribe(callback: () => void) {
  // `storage` fires for changes made in other tabs, the custom event for
  // this one.
  window.addEventListener('storage', callback);
  window.addEventListener(SAVED_LISTINGS_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SAVED_LISTINGS_EVENT, callback);
  };
}

/*
 * Lives in the (auth) layout, so it outlasts client-side navigation between
 * the marketplace and "my listings".
 *
 * The listings themselves are only ever held in memory: every page of
 * results the marketplace receives is remembered here, and the saved view is
 * the intersection of that with the stored fingerprints. Closing the tab
 * forgets them; nothing personal is written to disk, and nothing is fetched
 * that the marketplace did not already fetch.
 */
export function SavedListingsProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readSavedListingsRaw, () => null);

  // Expiry is judged against the time the tab opened; anything that expires
  // while it stays open is dropped on the next write.
  const [openedAt] = useState(() => Date.now());

  const store = useMemo(
    () => parseSavedListings(raw, openedAt),
    [raw, openedAt],
  );

  const [known, setKnown] = useState<ReadonlyMap<string, KnownListing>>(
    () => new Map(),
  );

  const hashes = useRef(new Map<string, string>());

  const hashOf = useCallback(async (id: string) => {
    let hash = hashes.current.get(id);

    if (!hash) {
      hash = await hashListingId(id);
      hashes.current.set(id, hash);
    }

    return hash;
  }, []);

  const rememberListings = useCallback(
    (listings: Listing[]) => {
      if (listings.length === 0) return;

      Promise.all(
        listings.map(async (listing) => ({
          listing,
          hash: await hashOf(listing.id),
        })),
      )
        .then((entries) => {
          setKnown((prev) => {
            const next = new Map(prev);

            // Overwrites too: an edited listing replaces its stale copy.
            for (const entry of entries) next.set(entry.listing.id, entry);

            return next;
          });
        })
        // crypto.subtle only exists in secure contexts; without it there
        // is simply nothing to match.
        .catch(() => {});
    },
    [hashOf],
  );

  const toggleSaved = useCallback(
    (listing: Listing) => {
      hashOf(listing.id)
        .then((hash) => {
          setKnown((prev) =>
            prev.has(listing.id)
              ? prev
              : new Map(prev).set(listing.id, { listing, hash }),
          );

          // Re-read rather than use `store`: another tab may have written
          // since this one rendered.
          const now = Date.now();

          writeSavedListings(
            toggleSavedListing(
              parseSavedListings(readSavedListingsRaw(), now),
              hash,
              now,
            ),
          );
        })
        .catch(() => {});
    },
    [hashOf],
  );

  useEffect(() => {
    sweepSavedListings(Date.now());

    // The first draft kept plain row ids; they are not migrated, just gone.
    try {
      window.localStorage.removeItem(LEGACY_SAVED_LISTINGS_KEY);
    } catch {
      // Storage unavailable: there is nothing to remove either.
    }
  }, []);

  const value = useMemo<SavedListingsContextValue>(() => {
    const savedListings = [...known.values()]
      .filter(({ hash }) => hash in store)
      .sort((a, b) => store[b.hash] - store[a.hash])
      .map(({ listing }) => listing);

    return {
      isSaved: (id) => {
        const entry = known.get(id);
        return entry !== undefined && entry.hash in store;
      },
      toggleSaved,
      rememberListings,
      savedListings,
      hasUnresolved: Object.keys(store).length > savedListings.length,
    };
  }, [known, store, toggleSaved, rememberListings]);

  return (
    <SavedListingsContext.Provider value={value}>
      {children}
    </SavedListingsContext.Provider>
  );
}

/** Null outside the provider, where cards simply show no bookmark. */
export function useSavedListings() {
  return useContext(SavedListingsContext);
}
