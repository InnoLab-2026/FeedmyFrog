'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import DisclaimerOverlay from '@/components/marketplace/DisclaimerOverlay';
import LanguageButton from '@/components/layout/LanguageButton';

import LocationSearch, {
  type LocationFilter,
} from '@/components/marketplace/LocationSearch';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showMyListingsButton?: boolean;

  locationFilter?: LocationFilter | null;
  onLocationChange?: (value: LocationFilter | null) => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  showMyListingsButton = true,
  locationFilter: externalLocationFilter,
  onLocationChange,
}: HeaderProps) {
  const { t } = useTranslation();

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Falls der Header ohne externe Standort-Props verwendet wird
  // (z.B. auf "Meine Anzeigen"), funktioniert das Feld trotzdem.
  const [localLocationFilter, setLocalLocationFilter] =
    useState<LocationFilter | null>(null);

  const locationFilter =
    externalLocationFilter !== undefined
      ? externalLocationFilter
      : localLocationFilter;

  const handleLocationChange = (
    value: LocationFilter | null,
  ) => {
    if (onLocationChange) {
      onLocationChange(value);
    } else {
      setLocalLocationFilter(value);
    }
  };

  return (
    <>
      <header
        className="relative"
        style={{
          background: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Oben rechts */}
        <div
          className="absolute flex items-center gap-3"
          style={{
            top: '22px',
            right: '28px',
            zIndex: 20,
          }}
        >
          {/* User */}
          <button
            type="button"
            aria-label="Benutzer"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid rgba(47,47,47,0.15)',
              background: '#8DC63F',
              color: '#1a3200',
              fontSize: 'var(--fs-base)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            BA
          </button>

          {/* Info */}
          <button
            type="button"
            onClick={() => setShowDisclaimer(true)}
            aria-label={t('disclaimer_btn')}
            aria-haspopup="dialog"
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              border: '1px solid rgba(47,47,47,0.18)',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#6a6a6a',
            }}
          >
            <Info
              style={{
                width: '20px',
                height: '20px',
              }}
            />
          </button>

          {/* Sprache */}
          <LanguageButton />
        </div>

        {/* Header Inhalt */}
        <div
          className="flex flex-col md:flex-row md:items-center"
          style={{
            minHeight: '300px',
            padding: '70px 68px 55px',
            gap: '38px',
          }}
        >
          {/* Logo */}
          <div
            className="flex-shrink-0"
            style={{
              width: '260px',
            }}
          >
            <img
              src="/feedmyfrog.jpg"
              alt="feedmyfrog"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          {/* Suche + Standort + Button */}
          <div
            className="flex flex-col"
            style={{
              flex: 1,
              gap: '18px',
              maxWidth: '1100px',
            }}
          >
            <div
              className="flex flex-col md:flex-row"
              style={{
                gap: '18px',
              }}
            >
              {/* Suche */}
              <div
                className="relative"
                style={{
                  flex: 1,
                  maxWidth: '760px',
                }}
              >
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2"
                  style={{
                    width: '26px',
                    height: '26px',
                    color: '#666',
                  }}
                />

                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) =>
                    onSearchChange(e.target.value)
                  }
                  className="w-full focus:outline-none"
                  style={{
                    height: '72px',
                    paddingLeft: '74px',
                    paddingRight: '24px',
                    background: '#F7FBF9',
                    border:
                      '1px solid rgba(47,47,47,0.15)',
                    borderRadius: '10px',
                    fontSize: 'var(--fs-control-input)',
                    color: '#444',
                  }}
                />
              </div>

              {/* Standort */}
              <div
                style={{
                  width: '320px',
                  flexShrink: 0,
                }}
              >
                <LocationSearch
                  value={locationFilter}
                  onChange={handleLocationChange}
                />
              </div>
            </div>

            {/* Eigene Anzeigen verwalten */}
            {showMyListingsButton && (
              <div>
                <Link
                  href="/meine"
                  className="inline-flex items-center justify-center"
                  style={{
                    gap: '14px',
                    minHeight: '64px',
                    padding: '0 34px',
                    background: '#8DC63F',
                    color: '#1a3200',
                    border: '1px solid #8DC63F',
                    borderRadius: '9px',
                    fontSize: 'var(--fs-control-button)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Plus
                    style={{
                      width: '26px',
                      height: '26px',
                    }}
                  />

                  {t('manage_listings')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {showDisclaimer && (
        <DisclaimerOverlay
          onClose={() => setShowDisclaimer(false)}
        />
      )}
    </>
  );
}