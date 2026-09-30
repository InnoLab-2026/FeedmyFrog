'use client';

import { useTranslation } from 'react-i18next';

import { LEGAL_NS, useLegalResources } from '@/i18n/legal';
import {
  LegalHeading,
  LegalLink,
  LegalParagraph,
  LegalSection,
  LegalTitle,
} from '@/components/layout/LegalText';

/*
 * Angaben gemäß § 5 DDG, filled with Hochschule Reutlingen's standard
 * operator block (as on reutlingen-university.de/impressum). The wording is
 * in src/i18n/legalResources.ts, in every language -- keep all five in step
 * when the university's own details change.
 */

const SECTIONS = ['operator', 'contact', 'responsible', 'note', 'hosting'] as const;

export default function ImpressumContent() {
  const { t, i18n } = useTranslation(LEGAL_NS);

  // Attaches the legal wording to this render's i18next instance before
  // the first t() below reads from it. Kept out of the instance's initial
  // resources so it does not ship with every route.
  useLegalResources(i18n);

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
