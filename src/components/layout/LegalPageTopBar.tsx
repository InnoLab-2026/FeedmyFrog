'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import LanguageButton from '@/components/layout/LanguageButton';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function LegalPageTopBar() {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link
        href="/"
        className="py-2 px-4 rounded-xl inline-block"
        style={{
          background: 'var(--card-bg)',
          color: 'var(--page-fg)',
          border: '1px solid rgba(232,234,223,0.25)',
          fontWeight: 600,
          fontSize: 'var(--fs-sm)',
          textDecoration: 'none',
        }}
      >
        <span aria-hidden="true">←</span> {t('back_to_overview')}
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageButton />
      </div>
    </div>
  );
}