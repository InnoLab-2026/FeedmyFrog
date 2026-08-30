'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { deleteListing } from '@/actions/listings';
import type { Listing } from '@/types';

import ListingCard from '@/components/marketplace/ListingCard';
import MyListingsHeader from '@/components/layout/MyListingsHeader';
import CreateListingModal from '@/components/marketplace/CreateListingModal';

interface MyListingsPageContentProps {
  data: Listing[];
  email: string;
}

export default function MyListingsPageContent({
  data,
  email,
}: MyListingsPageContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <MyListingsHeader email={email} />

      <main
        className="min-h-screen"
        style={{
          background: '#f7f8f7',
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
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            ← {t('back_to_overview')}
          </Link>

          <div
            className="flex flex-col md:flex-row md:items-end md:justify-between"
            style={{ gap: '12px', marginBottom: '16px' }}
          >
            <div>
              <h1
                style={{
                  margin: '0 0 6px',
                  color: '#2f2f2f',
                  fontSize: '28px',
                  lineHeight: 1.25,
                  fontWeight: 700,
                }}
              >
                {t('my_listings_title')}
              </h1>
              <p
                style={{
                  margin: 0,
                  color: '#6a6a6a',
                  fontSize: '15px',
                  lineHeight: 1.5,
                }}
              >
                {t('my_listings_description')}
              </p>
            </div>

            <CreateListingModal email={email} />
          </div>

          {data.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid rgba(47,47,47,0.14)',
                borderRadius: '12px',
                padding: '64px 30px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: '0 0 20px',
                  color: '#6a6a6a',
                  fontSize: 'var(--fs-base)',
                }}
              >
                {t('no_own_listings')}
              </p>
              <CreateListingModal email={email} />
            </div>
          ) : (
            <div className="space-y-5">
              {data.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  ownerActions={
                    <div
                      className="flex flex-wrap gap-3"
                      style={{ marginTop: '14px' }}
                    >
                      <Link
                        href={`/meine/${listing.id}/edit`}
                        className="inline-flex items-center justify-center"
                        style={{
                          minHeight: '42px',
                          padding: '0 18px',
                          background: 'white',
                          color: '#2f2f2f',
                          border: '1px solid rgba(47,47,47,0.2)',
                          borderRadius: '7px',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        {t('edit')}
                      </Link>
                      <form action={deleteListing}>
                        <input type="hidden" name="id" value={listing.id} />
                        <button
                          type="submit"
                          style={{
                            minHeight: '42px',
                            padding: '0 18px',
                            background: 'white',
                            color: '#b42318',
                            border: '1px solid rgba(180,35,24,0.3)',
                            borderRadius: '7px',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {t('delete')}
                        </button>
                      </form>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}