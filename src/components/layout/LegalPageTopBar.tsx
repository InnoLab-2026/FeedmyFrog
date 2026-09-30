'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import LanguageButton from '@/components/layout/LanguageButton';
import ThemeToggle from '@/components/layout/ThemeToggle';

/*
 * The legal body text on /datenschutz and /impressum stays German-only —
 * machine-translating compliance/legal text without review would risk
 * misrepresenting it. This bar just keeps navigation (back, theme and
 * language switch) consistent with the rest of the app on those two pages.
 */
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
          border: '1px solid var(--control-border)',
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
