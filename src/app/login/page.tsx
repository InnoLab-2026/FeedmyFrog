import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';
import { CARD_SHADOW } from '@/constants';

export const metadata: Metadata = {
  title: 'Anmelden · Reutlingen University Connect',
};

const ERRORS: Record<string, string> = {
  missing_token: 'Der Anmeldelink war unvollständig. Bitte fordern Sie einen neuen an.',
  invalid_or_expired:
    'Dieser Anmeldelink ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const initialError = error ? (ERRORS[error] ?? null) : null;

  return (
    <main className="flex min-h-screen items-center justify-center p-6" style={{ background: '#f5f5f5' }}>
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
        <h1
          style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, fontSize: '24px', color: 'black' }}
        >
          Reutlingen University Connect
        </h1>
        <p className="mt-2" style={{ fontSize: '14px', fontWeight: 500, color: 'black' }}>
          Melden Sie sich mit Ihrer Hochschul-E-Mail-Adresse an. Wir senden Ihnen
          einen einmaligen Anmeldelink.
        </p>
        <LoginForm initialError={initialError} />
        <p className="mt-6" style={{ fontSize: '12px', fontWeight: 500, color: 'black' }}>
          Informationen zur Verarbeitung Ihrer Daten finden Sie in der{' '}
          <Link href="/datenschutz" className="hover:underline" style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}>
            Datenschutzerklärung
          </Link>
          {' · '}
          <Link href="/impressum" className="hover:underline" style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}>
            Impressum
          </Link>
        </p>
      </div>
    </main>
  );
}
