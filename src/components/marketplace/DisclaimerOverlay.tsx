'use client';
import { Trans, useTranslation } from 'react-i18next';
import { CARD_SHADOW } from '@/constants';

const INSTITUTION_DOMAIN = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN ?? '';

/** What an accepted address looks like, e.g. `@(*.)reutlingen-university.de`. */
const DOMAIN_PATTERN = `@(*.)${INSTITUTION_DOMAIN}`;

interface DisclaimerOverlayProps {
  onClose: () => void;
}

export default function DisclaimerOverlay({ onClose }: DisclaimerOverlayProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-5"
      style={{ background: 'rgba(0, 0, 0, 0.55)', zIndex: 50, cursor: 'pointer' }}
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label={t('disclaimer_title')}
    >
      <div
        className="p-6 rounded-2xl w-full"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW, maxWidth: '400px', cursor: 'default' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('disclaimer_title')}
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ border: '2px solid black', background: 'white', cursor: 'pointer' }}
            aria-label={t('close')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1L9 9M9 1L1 9" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <ul className="space-y-3" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.6, fontWeight: 500 }}>
          {/* One sentence per bullet with the domain interpolated into it,
              rather than a `_pre` + domain + `_post` sandwich. The sandwich
              pinned the domain to the middle of the sentence, which is not
              where every language puts it, and gave translators two
              half-sentences with no way to see the whole. */}
          <li>
            <Trans
              i18nKey="disclaimer_bullet1"
              values={{ domain: DOMAIN_PATTERN }}
              components={{ domain: <span style={{ fontWeight: 700 }} /> }}
            />
          </li>
          <li>
            <Trans
              i18nKey="disclaimer_bullet2"
              values={{ domain: DOMAIN_PATTERN }}
              components={{ domain: <span style={{ fontWeight: 700 }} /> }}
            />
          </li>
          <li style={{ fontWeight: 700 }}>{t('disclaimer_bullet3')}</li>
        </ul>
      </div>
    </div>
  );
}
