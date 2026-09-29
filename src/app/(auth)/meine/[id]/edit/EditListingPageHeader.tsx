'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageButton from '@/components/layout/LanguageButton';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function EditListingPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-stretch gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
      <h1
        style={{
          fontWeight: 700,
          fontSize: 'var(--fs-2xl)',
          color: 'var(--page-fg)',
        }}
      >
        {t('edit_listing_title')}
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center justify-end gap-3">
          <ThemeToggle />
          <LanguageButton />
        </div>
        <Link
          href="/meine"
          aria-label={t('back_to_my_listings')}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'var(--card-bg)',
            color: 'var(--page-fg)',
            border: '1px solid var(--control-border)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </Link>
      </div>
    </div>
  );
}
