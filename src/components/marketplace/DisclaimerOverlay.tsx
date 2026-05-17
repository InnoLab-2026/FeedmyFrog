'use client';
import { useTranslation } from 'react-i18next';
import { CARD_SHADOW } from '@/constants';

const INSTITUTION_DOMAIN = process.env.NEXT_PUBLIC_INSTITUTION_DOMAIN ?? '';

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
          <p style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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

        <ul className="space-y-3" style={{ fontSize: '13px', lineHeight: 1.6, fontWeight: 500 }}>
          <li>
            {t('disclaimer_bullet1_pre')}{' '}
            <span style={{ fontWeight: 700 }}>@(*.){INSTITUTION_DOMAIN}</span>{' '}
            {t('disclaimer_bullet1_post')}
          </li>
          <li>
            {t('disclaimer_bullet2_pre')}{' '}
            <span style={{ fontWeight: 700 }}>@(*.){INSTITUTION_DOMAIN}</span>{' '}
            {t('disclaimer_bullet2_post')}
          </li>
          <li style={{ fontWeight: 700 }}>{t('disclaimer_bullet3')}</li>
        </ul>

        <p className="mt-4" style={{ fontSize: '11px', color: '#666', fontWeight: 500 }}>
          {t('click_to_close')}
        </p>
      </div>
    </div>
  );
}
