'use client';

import { useTranslation } from 'react-i18next';

import { LEGAL_NS } from '@/i18n/legal';
import {
  LegalHeading,
  LegalLink,
  LegalList,
  LegalParagraph,
  LegalSection,
  LegalTitle,
} from '@/components/layout/LegalText';

/*
 * Art. 13 GDPR information duties. The [ ] placeholders have to be filled in
 * before the platform goes live — in src/i18n/legal.ts, in every language,
 * since the same disclosure is owed to every reader.
 *
 * The document structure lives here and the wording lives in the `legal`
 * namespace, so all five locales necessarily render the same sections in the
 * same order. Previously each language was its own component tree, and three
 * of them had quietly drifted: French, Turkish and Spanish replaced the
 * processor list with a single sentence and dropped the erasure route and
 * the named supervisory authority from section 7.
 */

const DATA_ITEMS = ['email', 'listing', 'ip', 'cookie', 'logs'] as const;
const PROCESSORS = ['vercel', 'neon', 'brevo'] as const;
const RETENTION_ROWS = ['token', 'session', 'ip', 'listings'] as const;

export default function DatenschutzContent() {
  const { t } = useTranslation(LEGAL_NS);

  return (
    <>
      <LegalTitle>{t('privacy.title')}</LegalTitle>

      <LegalSection>
        <LegalHeading>{t('privacy.controller.heading')}</LegalHeading>
        <LegalParagraph i18nKey="privacy.controller.body" />

        <LegalHeading>{t('privacy.purpose.heading')}</LegalHeading>
        <LegalParagraph i18nKey="privacy.purpose.body" />

        <LegalHeading>{t('privacy.data.heading')}</LegalHeading>
        <LegalList itemKeys={DATA_ITEMS.map((item) => `privacy.data.${item}`)} />

        <LegalHeading>{t('privacy.visibility.heading')}</LegalHeading>
        <LegalParagraph i18nKey="privacy.visibility.body" />

        <LegalHeading>{t('privacy.retention.heading')}</LegalHeading>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b py-2 pr-4 font-semibold">
                {t('privacy.retention.columns.data')}
              </th>
              <th className="border-b py-2 font-semibold">
                {t('privacy.retention.columns.period')}
              </th>
            </tr>
          </thead>
          <tbody>
            {RETENTION_ROWS.map((row) => (
              <tr key={row}>
                <td className="border-b py-2 pr-4 align-top">
                  {t(`privacy.retention.rows.${row}.data`)}
                </td>
                <td className="border-b py-2 align-top">
                  {t(`privacy.retention.rows.${row}.period`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <LegalHeading>{t('privacy.processors.heading')}</LegalHeading>
        <LegalParagraph i18nKey="privacy.processors.intro" />
        <LegalList itemKeys={PROCESSORS.map((name) => `privacy.processors.${name}`)} />
        <LegalParagraph i18nKey="privacy.processors.fonts" />

        <LegalHeading>{t('privacy.rights.heading')}</LegalHeading>
        <LegalParagraph i18nKey="privacy.rights.body" />

        <LegalLink href="/impressum">{t('privacy.imprint_link')}</LegalLink>
      </LegalSection>
    </>
  );
}
