'use client';

import { useTranslation } from 'react-i18next';

import LanguageButton from '@/components/layout/LanguageButton';
import { CARD_SHADOW } from '@/constants';

export default function VerifyPromptCard({ token }: { token: string | null }) {
  const { t } = useTranslation();

  if (!token) {
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
            {t('invalid_link_title')}
          </h1>
          <p
            role="alert"
            className="mt-4 p-3 rounded-xl"
            style={{ border: '2px solid black', color: 'red', fontSize: 'var(--fs-sm)', fontWeight: 600, background: 'white' }}
          >
            {t('invalid_link_body')}
          </p>
          <p className="mt-4" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'black' }}>
            <a
              href="/login"
              className="hover:underline"
              style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
            >
              {t('request_new_link')}
            </a>
          </p>
        </div>
      </main>
    );
  }

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
          Reutlingen University Connect
        </h1>
        <p className="mt-2" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'black' }}>
          {t('verify_prompt_subtitle')}
        </p>

        <form action="/verify" method="POST" className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="w-full py-3 rounded-xl transition"
            style={{ background: 'black', color: 'white', fontWeight: 600 }}
          >
            {t('verify_now')}
          </button>
        </form>
      </div>
    </main>
  );
}
