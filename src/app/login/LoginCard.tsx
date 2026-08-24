'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import LoginForm from './LoginForm';
import LanguageButton from '@/components/layout/LanguageButton';
import { CARD_SHADOW } from '@/constants';

export default function LoginCard({
  initialErrorCode,
}: {
  initialErrorCode: string | null;
}) {
  const { t } = useTranslation();

  return (
    <main
      className="relative flex min-h-screen items-center justify-center p-6"
      style={{
        background: '#F6F8F7',
      }}
    >
      <div
        className="absolute"
        style={{ top: '20px', right: '20px' }}
      >
        <LanguageButton />
      </div>

      <div
        className="w-full"
        style={{
          maxWidth: '520px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '26px',
          }}
        >
          <img
            src="/feedmyfrog.jpg"
            alt="feedmyfrog"
            style={{
              width: '220px',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>

        {/* Login Card */}
        <div
          style={{
            background: 'white',
            border: '1px solid rgba(47,47,47,0.15)',
            borderRadius: '18px',
            padding: '34px',
            boxShadow: CARD_SHADOW,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-display)',
              fontWeight: 700,
              fontSize: 'var(--fs-3xl)',
              lineHeight: 1.2,
              color: '#2F2F2F',
            }}
          >
            Reutlingen University Connect
          </h1>

          <p
            style={{
              marginTop: '12px',
              marginBottom: 0,
              fontSize: 'var(--fs-md)',
              lineHeight: 1.6,
              fontWeight: 500,
              color: '#666',
            }}
          >
            {t('login_subtitle')}
          </p>

          <div
            style={{
              marginTop: '28px',
            }}
          >
            <LoginForm initialErrorCode={initialErrorCode} />
          </div>

          <div
            style={{
              height: '1px',
              background: 'rgba(47,47,47,0.08)',
              margin: '28px 0 20px',
            }}
          />

          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-2xs)',
              lineHeight: 1.6,
              fontWeight: 500,
              color: '#666',
            }}
          >
            {t('login_privacy_notice')}{' '}
            <Link
              href="/datenschutz"
              className="hover:underline"
              style={{
                color: '#659629',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              {t('privacy_policy_link')}
            </Link>

            {' · '}

            <Link
              href="/impressum"
              className="hover:underline"
              style={{
                color: '#659629',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              {t('imprint_link')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
