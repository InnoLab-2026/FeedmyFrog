'use client';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DisclaimerOverlay from '@/components/marketplace/DisclaimerOverlay';
import LanguageButton from '@/components/layout/LanguageButton';
import { INSTITUTION_NAME, SUBTITLE } from '@/constants';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  logoutAction: () => Promise<void>;
}

export default function Header({ searchQuery, onSearchChange, logoutAction }: HeaderProps) {
  const { t } = useTranslation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <>
      <header
        className="px-5 pt-8 pb-6 mb-6"
        style={{ background: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}
      >
        {/* Top bar: brand + language button */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <h1
              className="text-[32px] leading-[1.2] inline-block px-6 py-3 rounded-full self-start"
              style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, letterSpacing: '-0.02em', background: 'white' }}
            >
              &lt;{INSTITUTION_NAME} Connect&gt;
            </h1>
            <p
              className="text-[15px] inline-block px-6 py-2 rounded-full self-start"
              style={{ fontWeight: 500, background: 'white' }}
            >
              &lt;{SUBTITLE}&gt;
            </p>
          </div>

          {/* Language button + logout — top right */}
          <div className="flex flex-shrink-0 items-center gap-2 pt-1">
            <LanguageButton />
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-xl px-3 py-2 text-sm font-medium"
                style={{ background: 'white', border: '2px solid black' }}
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>

        {/* Controls: search + location + disclaimer */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-end">
            {/* Search */}
            <div className="relative w-full md:w-auto md:flex-shrink-0" style={{ maxWidth: '560px' }}>
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-14 pr-5 py-3 rounded-xl focus:outline-none placeholder:text-black"
                style={{ background: 'white', border: '2px solid black', fontSize: '15px', fontWeight: 500 }}
              />
            </div>

            {/* Location */}
            <div className="relative w-full md:w-auto md:flex-shrink-0 md:mr-[5%]" style={{ maxWidth: '160px' }}>
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" />
              <select
                className="w-full pl-12 pr-4 py-3 rounded-xl appearance-none cursor-pointer"
                style={{ background: 'white', color: 'black', border: '2px solid black', fontSize: '14px', fontWeight: 500 }}
              >
                <option>{t('location_label')}</option>
                <option>Stuttgart</option>
                <option>Ludwigsburg</option>
                <option>Esslingen</option>
                <option>Waiblingen</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Disclaimer button */}
          <div className="flex justify-end md:mr-[5%]">
            <button
              onClick={() => setShowDisclaimer(true)}
              className="py-2 px-5 rounded-xl"
              style={{ width: '160px', background: 'white', border: '2px solid black', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center' }}
              aria-haspopup="dialog"
            >
              {t('disclaimer_btn')}
            </button>
          </div>
        </div>
      </header>

      {showDisclaimer && <DisclaimerOverlay onClose={() => setShowDisclaimer(false)} />}
    </>
  );
}
