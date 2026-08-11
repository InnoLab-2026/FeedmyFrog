import type { Metadata } from 'next';
import Link from 'next/link';

import LoginForm from './LoginForm';
import { CARD_SHADOW } from '@/constants';

export const metadata: Metadata = {
  title: 'Anmelden · Reutlingen University Connect',
};

const ERRORS: Record<string, string> = {
  missing_token:
    'Der Anmeldelink war unvollständig. Bitte fordern Sie einen neuen an.',
  invalid_or_expired:
    'Dieser Anmeldelink ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const initialError =
    error ? (ERRORS[error] ?? null) : null;

  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{
        background: '#F6F8F7',
      }}
    >
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
            Melden Sie sich mit Ihrer Hochschul-E-Mail-Adresse an.
            Wir senden Ihnen einen einmaligen Anmeldelink.
          </p>

          <div
            style={{
              marginTop: '28px',
            }}
          >
            <LoginForm initialError={initialError} />
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
            Informationen zur Verarbeitung Ihrer Daten finden Sie in der{' '}
            <Link
              href="/datenschutz"
              className="hover:underline"
              style={{
                color: '#659629',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              Datenschutzerklärung
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
              Impressum
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}