import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';

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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div
        className="w-full max-w-md rounded-[var(--radius)] p-8 shadow-sm"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-family-display)' }}
        >
          Reutlingen University Connect
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Melden Sie sich mit Ihrer Hochschul-E-Mail-Adresse an. Wir senden Ihnen
          einen einmaligen Anmeldelink.
        </p>
        <LoginForm initialError={initialError} />
        <p className="mt-6 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Informationen zur Verarbeitung Ihrer Daten finden Sie in der{' '}
          <Link href="/datenschutz" style={{ color: 'var(--primary)' }}>
            Datenschutzerklärung
          </Link>
          {' · '}
          <Link href="/impressum" style={{ color: 'var(--primary)' }}>
            Impressum
          </Link>
        </p>
      </div>
    </main>
  );
}
