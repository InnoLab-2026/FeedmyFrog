'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import ListingCard from '@/components/marketplace/ListingCard';
import { useSavedListings } from '@/components/marketplace/SavedListingsProvider';
import { SAVED_LISTING_TTL_DAYS } from '@/lib/savedListings';

interface SavedListingsViewProps {
  /** The marketplace URL this view was opened over, filters intact. */
  backHref: string;
}

/*
 * The marketplace's `?saved=1` view. It renders only listings the
 * marketplace has already received in this tab (see SavedListingsProvider),
 * so it costs no query of its own.
 */
export default function SavedListingsView({ backHref }: SavedListingsViewProps) {
  const { t } = useTranslation();
  const saved = useSavedListings();

  const listings = saved?.savedListings ?? [];

  return (
    <>
      <Link
        href={backHref}
        scroll={false}
        className="inline-flex items-center"
        style={{
          gap: '8px',
          margin: '20px 0 12px',
          color: '#659629',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        <span aria-hidden="true">←</span> {t('back_to_overview')}
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
          {t('saved_listings_title')}
        </h1>

        <p
          className="flex items-start"
          style={{
            gap: '6px',
            margin: 0,
            color: 'var(--muted-fg)',
            fontSize: 'var(--fs-sm)',
            lineHeight: 1.5,
          }}
        >
          <Info
            aria-hidden="true"
            style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }}
          />
          {t('saved_listings_description', { days: SAVED_LISTING_TTL_DAYS })}
        </p>
      </div>

      {listings.length === 0 ? (
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
            {saved?.hasUnresolved
              ? t('saved_listings_partial')
              : t('no_saved_listings')}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {saved?.hasUnresolved && (
            <p
              style={{
                marginTop: '20px',
                color: 'var(--muted-fg)',
                fontSize: 'var(--fs-sm)',
              }}
            >
              {t('saved_listings_partial')}
            </p>
          )}
        </>
      )}
    </>
  );
}
