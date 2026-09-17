'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import LanguageButton from '@/components/layout/LanguageButton';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function EditListingPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-6 gap-3">
      <h1
        style={{
          fontWeight: 700,
          fontSize: 'var(--fs-2xl)',
          color: 'var(--page-fg)',
        }}
      >
        {t('edit_listing_title')}
      </h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <LanguageButton />

        <Link
          href="/meine"
          className="py-2 px-4 rounded-xl"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--page-fg)',
            border: '1px solid var(--control-border)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true">←</span> {t('my_entries')}
        </Link>
      </div>
    </div>
  );
}
