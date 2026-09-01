'use client';

import { useTranslation } from 'react-i18next';

import { LEGAL_NS } from '@/i18n/legal';
import {
  LegalHeading,
  LegalLink,
  LegalParagraph,
  LegalSection,
  LegalTitle,
} from '@/components/layout/LegalText';

/*
 * Angaben gemäß § 5 DDG. The [ ] placeholders have to be filled in with the
 * actual operator's details before the internal pilot — in src/i18n/legal.ts,
 * in every language.
 */

const SECTIONS = ['operator', 'contact', 'responsible', 'note', 'hosting'] as const;

export default function ImpressumContent() {
  const { t } = useTranslation(LEGAL_NS);

  return (
    <>
      <LegalTitle>{t('imprint.title')}</LegalTitle>

      <LegalSection>
        {SECTIONS.map((section) => (
          <div key={section} className="space-y-4">
            <LegalHeading>{t(`imprint.${section}.heading`)}</LegalHeading>
            <LegalParagraph i18nKey={`imprint.${section}.body`} />
          </div>
        ))}

        <LegalLink href="/datenschutz">{t('imprint.privacy_link')}</LegalLink>
      </LegalSection>
    </>
  );
}
