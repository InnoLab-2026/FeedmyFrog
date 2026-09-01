'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import LanguageButton from '@/components/layout/LanguageButton';

export default function EditListingPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-6 gap-3">
      <h1 style={{ fontWeight: 700, fontSize: 'var(--fs-2xl)' }}>{t('edit_listing_title')}</h1>

      <div className="flex items-center gap-3">
        <LanguageButton />

        <Link
          href="/meine"
          className="py-2 px-4 rounded-xl"
          style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}
        >
          <span aria-hidden="true">←</span> {t('my_entries')}
        </Link>
      </div>
    </div>
  );
}
