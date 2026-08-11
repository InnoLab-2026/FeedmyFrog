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
          className="absolute flex items-center gap-2"
          style={{
            top: '14px',
            right: '20px',
            zIndex: 20,
          }}
        >
          {/* User */}
          <button
            type="button"
            aria-label="Benutzer"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(47,47,47,0.15)',
              background: '#8DC63F',
              color: '#1a3200',
              fontSize: 'var(--fs-sm)',
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
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              border: '1px solid rgba(47,47,47,0.18)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#6a6a6a',
            }}
          >
            <Info
              style={{
                width: '16px',
                height: '16px',
              }}
            />
          </button>

          {/* Sprache */}
          <LanguageButton />
        </div>

        {/* Header Inhalt */}
        {/* pr reserves room for the absolutely-positioned avatar/info/language
            cluster above so it never overlaps the location field once the
            search+location row grows narrower than its 1100px max-width
            (roughly 768px–1310px viewports). Inline `style` always beats a
            plain class, so the md: override has to live in className. */}
        <div
          className="flex flex-col md:flex-row md:items-center pr-8 md:pr-[210px]"
          style={{
            paddingTop: '20px',
            paddingLeft: '32px',
            paddingBottom: '22px',
            gap: '20px',
          }}
        >
          {/* Logo */}
          <div
            className="flex-shrink-0"
            style={{
              width: '128px',
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
              gap: '12px',
              maxWidth: '1100px',
            }}
          >
            <div
              className="flex flex-col md:flex-row"
              style={{
                gap: '12px',
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
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{
                    width: '18px',
                    height: '18px',
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
                    height: '44px',
                    paddingLeft: '42px',
                    paddingRight: '16px',
                    background: '#F7FBF9',
                    border:
                      '1px solid rgba(47,47,47,0.15)',
                    borderRadius: '9px',
                    fontSize: 'var(--fs-control-input)',
                    color: '#444',
                  }}
                />
              </div>

              {/* Standort */}
              <div
                style={{
                  width: '240px',
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
                    gap: '8px',
                    minHeight: '40px',
                    padding: '0 18px',
                    background: '#8DC63F',
                    color: '#1a3200',
                    border: '1px solid #8DC63F',
                    borderRadius: '8px',
                    fontSize: 'var(--fs-control-button)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <Plus
                    style={{
                      width: '18px',
                      height: '18px',
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