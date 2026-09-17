'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Info, List, LogOut, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { logout } from '@/actions/auth';
import { getInitials, displayNameFromEmail } from '@/lib/initials';
import DisclaimerOverlay from '@/components/marketplace/DisclaimerOverlay';
import LanguageButton from '@/components/layout/LanguageButton';

import LocationSearch, {
  type LocationFilter,
} from '@/components/marketplace/LocationSearch';

import CreateListingModal from '@/components/marketplace/CreateListingModal';
import ThemeToggle from '@/components/layout/ThemeToggle';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showMyListingsButton?: boolean;
  email: string;
  locationFilter?: LocationFilter | null;
  onLocationChange?: (value: LocationFilter | null) => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  showMyListingsButton = true,
  email,
  locationFilter: externalLocationFilter,
  onLocationChange,
}: HeaderProps) {
  const { t } = useTranslation();

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showAccountMenu) return;
    const handler = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAccountMenu]);

  const [localLocationFilter, setLocalLocationFilter] =
    useState<LocationFilter | null>(null);

  const locationFilter =
    externalLocationFilter !== undefined
      ? externalLocationFilter
      : localLocationFilter;

  const handleLocationChange = (value: LocationFilter | null) => {
    if (onLocationChange) onLocationChange(value);
    else setLocalLocationFilter(value);
  };

  const initials = getInitials(email);
  const displayName = displayNameFromEmail(email);

  return (
    <>
      <header
        className="relative"
        style={{
          background: 'var(--card-bg)',
          boxShadow: 'var(--elevation-md)',
        }}
      >
        <div
          className="absolute flex items-center gap-2"
          style={{ top: '14px', right: '20px', zIndex: 20 }}
        >
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setShowAccountMenu((current) => !current)}
              aria-label={t('account_menu')}
              aria-haspopup="menu"
              aria-expanded={showAccountMenu}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid var(--card-border)',
                background: '#8DC63F',
                color: 'var(--on-accent)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {initials}
            </button>

            {showAccountMenu && (
              <div
                role="menu"
                className="absolute right-0"
                style={{
                  top: 'calc(100% + 8px)',
                  width: '280px',
                  color: 'var(--page-fg)',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '14px',
                  boxShadow: 'var(--elevation-lg)',
                  overflow: 'hidden',
                  zIndex: 30,
                }}
              >
                <div
                  className="flex items-center"
                  style={{ gap: '12px', padding: '14px 16px' }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#8DC63F',
                      color: 'var(--on-accent)',
                      fontWeight: 700,
                      fontSize: 'var(--fs-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 'var(--fs-sm)',
                        color: 'var(--page-fg)',
                      }}
                    >
                      {displayName}
                    </div>
                    <a
                      href={`mailto:${email}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--muted-fg)',
                        fontSize: 'var(--fs-2xs)',
                        textDecoration: 'none',
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {email}
                      </span>
                      <Mail style={{ width: '13px', height: '13px' }} />
                    </a>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--divider)' }} />

                <Link
                  href="/meine"
                  role="menuitem"
                  onClick={() => setShowAccountMenu(false)}
                  className="flex items-center"
                  style={{
                    gap: '10px',
                    padding: '12px 16px',
                    color: 'var(--page-fg)',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'var(--card-bg)',
                  }}
                >
                  <List style={{ width: '16px', height: '16px' }} />
                  {t('my_entries')}
                </Link>

                <div style={{ height: '1px', background: 'var(--divider)' }} />

                <form action={logout}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex items-center w-full"
                    style={{
                      gap: '10px',
                      padding: '12px 16px',
                      background: 'var(--card-bg)',
                      border: 'none',
                      color: 'var(--danger-fg)',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut style={{ width: '16px', height: '16px' }} />
                    {t('logout')}
                  </button>
                </form>
              </div>
            )}
          </div>

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
              background: 'var(--card-bg)',
              border: '1px solid var(--control-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--page-fg)',
            }}
          >
            <Info style={{ width: '16px', height: '16px' }} />
          </button>
          <ThemeToggle />
          <LanguageButton />
        </div>

        {/* pr reserves room for the absolutely-positioned avatar/info/language
            cluster above so it never overlaps the location field once the
            search+location row grows narrower than its 1100px max-width
            (roughly 768px-1310px viewports). Inline `style` always beats a
            plain class, so the md: override has to live in className. */}
        <div
          className="flex flex-col md:flex-row md:items-center pr-8 md:pr-[210px]"
          style={{
            paddingTop: '28px',
            paddingLeft: '32px',
            paddingBottom: '22px',
            gap: '20px',
          }}
        >
          <div className="flex-shrink-0" style={{ width: '168px' }}>
            <Link
              href="/"
              aria-label={t('go_home')}
              style={{ display: 'block' }}
            >
              {/* width/height are the file's real 480x373, which is what
                  reserves the right box before it loads; `sizes` is what this
                  slot actually paints, so next/image resizes to 168px (plus a
                  2x srcset) and re-encodes to AVIF/WebP rather than shipping
                  the full width. `priority` opts out of the default lazy
                  loading -- the logo is above the fold on every page the
                  header renders on, and is the LCP candidate on the wider
                  viewports where it sits beside the search row.

                  alt="" because the enclosing link is already named by its
                  aria-label: a link labelled twice is read out twice. */}
              <Image
                src="/feedmyfrog.png"
                alt=""
                width={480}
                height={373}
                sizes="168px"
                priority
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </Link>
          </div>

          <div
            className="flex flex-col"
            style={{ flex: 1, gap: '12px', maxWidth: '1100px' }}
          >
            <div className="flex flex-col md:flex-row" style={{ gap: '12px' }}>
              <div className="relative" style={{ flex: 1, maxWidth: '760px' }}>
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ width: '18px', height: '18px', color: '#666' }}
                />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full focus:outline-none"
                  style={{
                    height: '44px',
                    paddingLeft: '42px',
                    paddingRight: '16px',
                    background: 'var(--input-bg)',
                    color: 'var(--page-fg)',
                    border: '1px solid var(--control-border)',
                    borderRadius: '9px',
                    fontSize: 'var(--fs-control-input)',
                  }}
                />
              </div>

              <div style={{ width: '240px', flexShrink: 0 }}>
                <LocationSearch
                  value={locationFilter}
                  onChange={handleLocationChange}
                />
              </div>
            </div>

            {showMyListingsButton && (
              <div>
                <CreateListingModal
                  email={email}
                  label={t('manage_listings')}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {showDisclaimer && (
        <DisclaimerOverlay onClose={() => setShowDisclaimer(false)} />
      )}
    </>
  );
}
