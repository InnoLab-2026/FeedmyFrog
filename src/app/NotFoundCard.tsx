'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import LanguageButton from '@/components/layout/LanguageButton';
import { CARD_SHADOW } from '@/constants';

export default function NotFoundCard() {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6" style={{ background: '#f5f5f5' }}>
      <div className="absolute" style={{ top: '20px', right: '20px' }}>
        <LanguageButton />
      </div>

      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
        <h1
          style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, fontSize: 'var(--fs-2xl)', color: 'black' }}
        >
          {t('not_found_title')}
        </h1>
        <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'black' }}>
          {t('not_found_body')}{' '}
          <Link
            href="/"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            {t('go_home')}
          </Link>
        </p>
      </div>
    </main>
  );
}
