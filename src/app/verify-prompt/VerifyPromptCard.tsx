'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LanguageButton from '@/components/layout/LanguageButton';
import { CARD_SHADOW } from '@/constants';

export default function VerifyPromptCard({ token }: { token: string | null }) {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{ background: '#f5f5f5' }}
    >
      <div className="absolute" style={{ top: '20px', right: '20px' }}>
        <LanguageButton />
      </div>

      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{
          background: 'white',
          border: '2px solid black',
          boxShadow: CARD_SHADOW,
        }}
      >
        <img
          src="/feedmyfrog.jpg"
          alt="feedmyfrog"
          style={{
            width: '140px',
            height: 'auto',
            display: 'block',
            margin: '0 auto 20px',
          }}
        />

        {!token ? (
          <>
            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 700,
                fontSize: 'var(--fs-2xl)',
                color: 'black',
                textAlign: 'center',
              }}
            >
              {t('invalid_link_title')}
            </h1>
            <p
              role="alert"
              className="mt-4 p-3 rounded-xl"
              style={{
                border: '1px solid rgba(220,38,38,0.25)',
                color: '#dc2626',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                background: '#fff7f7',
              }}
            >
              {t('invalid_link_body')}
            </p>
            <p className="mt-4" style={{ textAlign: 'center' }}>
              <a
                href="/login"
                style={{ color: '#659629', fontWeight: 700 }}
              >
                {t('request_new_link')}
              </a>
            </p>
          </>
        ) : (
          <>
            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontWeight: 700,
                fontSize: 'var(--fs-2xl)',
                color: 'black',
                textAlign: 'center',
              }}
            >
              feedmyfrog
            </h1>
            <p
              className="mt-2"
              style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 500,
                color: '#666',
                textAlign: 'center',
              }}
            >
              {t('verify_prompt_subtitle')}
            </p>

            <form
              action="/verify"
              method="POST"
              className="mt-6"
              onSubmit={() => setSending(true)}
            >
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                disabled={sending}
                className="w-full"
                style={{
                  minHeight: '54px',
                  background: '#8DC63F',
                  color: '#1a3200',
                  border: '1px solid #8DC63F',
                  borderRadius: '10px',
                  fontSize: 'var(--fs-control-button)',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.65 : 1,
                }}
              >
                {sending ? t('sending_link') : t('verify_now')}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}