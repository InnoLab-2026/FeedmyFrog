'use client';

import { useTranslation } from 'react-i18next';

import { LANGUAGES, type LangCode } from '@/i18n/translations';
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE } from '@/i18n/matchLanguage';

/* The English entry flies the Union Jack — there is no "en" flag, and the
   file names follow ISO 3166 country codes rather than the language codes. */
const FLAG_FILES: Record<LangCode, string> = {
  en: '/flags/gb.svg',
  de: '/flags/de.svg',
  fr: '/flags/fr.svg',
  tr: '/flags/tr.svg',
  es: '/flags/es.svg',
};

export default function LanguageButton() {
  const { t, i18n } = useTranslation();

  const currentCode = i18n.language as LangCode;
  const currentIdx = LANGUAGES.findIndex((l) => l.code === currentCode);
  const current = LANGUAGES[currentIdx] ?? LANGUAGES[0];
  const next = LANGUAGES[(currentIdx + 1) % LANGUAGES.length];

  const cycle = () => {
    i18n.changeLanguage(next.code);

    /*
     * Persist the choice in a cookie, not just localStorage: the server
     * renders the page title and <html lang>, and it can only read cookies.
     * Without this the next visit would be served in the browser's language
     * again and only correct itself after hydration.
     */
    try {
      const secure = window.location.protocol === 'https:' ? '; secure' : '';
      document.cookie =
        `${LANG_COOKIE}=${next.code}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax${secure}`;

      // Kept in sync for anyone still running a tab from before the cookie.
      window.localStorage.setItem('i18nextLng', next.code);
    } catch {
      // Cookies or storage may be blocked; the language still applies to
      // this session via changeLanguage above.
    }
  };

  return (
    <button
      onClick={cycle}
      // Language names are given in their own language (Deutsch, Français…),
      // which is what a reader looking for their language actually scans for
      // — and the surrounding sentence is translated rather than being the
      // hardcoded English it used to be.
      title={t('language_switch_to', { language: next.name })}
      aria-label={t('language_switch_aria', {
        current: current.name,
        next: next.name,
      })}
      className="flex items-center justify-center rounded-xl select-none"
      style={{
        background: 'white',
        border: '1px solid rgba(47,47,47,0.18)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        minWidth: '44px',
        height: '32px',
        padding: '0',
        lineHeight: 1,
      }}
    >
      {/* Decorative: the button's aria-label already names the current and
          next language, so an alt text here would only repeat it. */}
      <img
        src={FLAG_FILES[current.code]}
        alt=""
        width={22}
        height={16}
        style={{ display: 'block' }}
      />
    </button>
  );
}
