'use client';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type LangCode } from '@/i18n/translations';

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
  const { i18n } = useTranslation();
  const currentCode = i18n.language as LangCode;
  const currentIdx  = LANGUAGES.findIndex(l => l.code === currentCode);
  const current     = LANGUAGES[currentIdx] ?? LANGUAGES[0];
  const next        = LANGUAGES[(currentIdx + 1) % LANGUAGES.length];

  const cycle = () => {
    i18n.changeLanguage(next.code);

    // Explicit choice always wins over auto-detection on later visits.
    try {
      window.localStorage.setItem('i18nextLng', next.code);
    } catch {
      // localStorage may be unavailable (private browsing); language still
      // applies for this session via i18n.changeLanguage above.
    }
  };

  return (
    <button
      onClick={cycle}
      title={`Switch to ${next.label}`}
      aria-label={`Current language: ${current.label}. Click to switch to ${next.label}`}
      className="flex items-center justify-center rounded-xl select-none"
      style={{
        background: 'white',
        border: '2px solid black',
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
