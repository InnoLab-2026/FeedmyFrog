'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { deleteListing } from '@/actions/listings';
import { logout } from '@/actions/auth';
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
          padding: '48px 30px 80px',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {/* Zurück zur Übersicht + Abmelden */}
          <div
            className="flex items-center justify-between flex-wrap gap-3"
            style={{
              marginBottom: '34px',
              position: 'relative',
              zIndex: 20,
            }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              style={{
                background: 'white',
                color: '#2f2f2f',
                border: '1px solid rgba(47,47,47,0.18)',
                borderRadius: '8px',
                padding: '13px 18px',
                fontSize: 'var(--fs-md)',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 'var(--fs-lg)',
                  lineHeight: 1,
                }}
              >
                ←
              </span>

              {t('back_to_overview')}
            </Link>

            <form action={logout}>
              <button
                type="submit"
                style={{
                  background: 'white',
                  color: '#2f2f2f',
                  border: '1px solid rgba(47,47,47,0.18)',
                  borderRadius: '8px',
                  padding: '13px 18px',
                  fontSize: 'var(--fs-md)',
                  fontWeight: 600,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                }}
              >
                {t('logout')}
              </button>
            </form>
          </div>

          {/* Überschrift */}
          <div
            style={{
              marginBottom: '26px',
            }}
          >
            <h1
              style={{
                margin: '0 0 12px',
                color: '#2f2f2f',
                fontSize: 'var(--fs-4xl)',
                lineHeight: 1.2,
                fontWeight: 700,
              }}
            >
              {t('my_listings_title')}
            </h1>

            <p
              style={{
                margin: 0,
                color: '#6a6a6a',
                fontSize: 'var(--fs-lg)',
                lineHeight: 1.5,
              }}
            >
              {t('my_listings_description')}
            </p>
          </div>

          {/* Anzeige erstellen */}
          <div
            style={{
              marginBottom: '32px',
            }}
          >
            <CreateListingModal email={email} />
          </div>

          {/* Keine eigenen Anzeigen */}
          {data.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid rgba(47,47,47,0.14)',
                borderRadius: '12px',
                padding: '64px 30px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
                      style={{
                        marginTop: '14px',
                      }}
                    >
                      {/* Bearbeiten */}
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

                      {/* Löschen */}
                      <form action={deleteListing}>
                        <input
                          type="hidden"
                          name="id"
                          value={listing.id}
                        />

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