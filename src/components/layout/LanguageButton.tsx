'use client';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type LangCode } from '@/i18n/translations';

export default function LanguageButton() {
  const { i18n } = useTranslation();
  const currentCode = i18n.language as LangCode;
  const currentIdx  = LANGUAGES.findIndex(l => l.code === currentCode);
  const current     = LANGUAGES[currentIdx] ?? LANGUAGES[0];
  const next        = LANGUAGES[(currentIdx + 1) % LANGUAGES.length];

  const cycle = () => i18n.changeLanguage(next.code);

  return (
    <button
      onClick={cycle}
      title={`Switch to ${next.label}`}
      aria-label={`Current language: ${current.label}. Click to switch to ${next.label}`}
      className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl select-none"
      style={{
        background: 'white',
        border: '2px solid black',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{current.flag}</span>
      <span>{current.label}</span>
    </button>
  );
}
