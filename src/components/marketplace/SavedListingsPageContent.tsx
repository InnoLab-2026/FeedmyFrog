'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

import type { Listing } from '@/types';
import ListingCard from '@/components/marketplace/ListingCard';
import MyListingsHeader from '@/components/layout/MyListingsHeader';

interface SavedListingsPageContentProps {
  data: Listing[];
  email: string;
}

const SAVED_LISTINGS_KEY = 'savedListings';
const SAVED_LISTINGS_EVENT = 'saved-listings-change';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function subscribeToSavedListings(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(SAVED_LISTINGS_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SAVED_LISTINGS_EVENT, callback);
  };
}

function getSavedListingsSnapshot() {
  return window.localStorage.getItem(SAVED_LISTINGS_KEY) ?? '{}';
}

function getSavedListingsServerSnapshot() {
  return '{}';
}

export default function SavedListingsPageContent({
  data,
  email,
}: SavedListingsPageContentProps) {
  const savedListingsSnapshot = useSyncExternalStore(
    subscribeToSavedListings,
    getSavedListingsSnapshot,
    getSavedListingsServerSnapshot,
  );

  let stored: Record<string, number> = {};

  try {
    stored = JSON.parse(savedListingsSnapshot) as Record<string, number>;
  } catch {
    stored = {};
  }

  const savedListings = data.filter((listing) => {
    const savedAt = stored[listing.id];

    return (
      typeof savedAt === 'number' &&
      new Date().getTime() - savedAt < SEVEN_DAYS_MS
    );
  });

  return (
    <>
      <MyListingsHeader email={email} />

      <main
        className="min-h-screen"
        style={{
          background: 'var(--page-bg)',
          padding: '20px 30px 80px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
          }}
        >
          <Link
            href="/"
            className="inline-flex items-center"
            style={{
              gap: '8px',
              marginBottom: '12px',
              color: '#659629',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span aria-hidden="true">←</span> Zurück zur Übersicht
          </Link>

          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                margin: '0 0 6px',
                color: 'var(--page-fg)',
                fontSize: 'var(--fs-3xl)',
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              Meine gespeicherten Anzeigen
            </h1>

            <p
              style={{
                margin: 0,
                color: 'var(--muted-fg)',
                fontSize: 'var(--fs-sm)',
                lineHeight: 1.5,
              }}
            >
              ⓘ Gespeicherte Anzeigen werden 7 Tage nach dem Speichern
              automatisch aus dieser Liste entfernt.
            </p>
          </div>

          {savedListings.length === 0 ? (
            <div
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '64px 30px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: 'var(--muted-fg)',
                  fontSize: 'var(--fs-base)',
                }}
              >
                Sie haben noch keine Anzeigen gespeichert.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {savedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}