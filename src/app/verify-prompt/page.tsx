import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anmelden · Reutlingen University Connect',
};

export default async function VerifyPromptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
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
            Ungültiger Link
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Der Anmeldelink war unvollständig.{' '}
            <a href="/login" style={{ color: 'var(--primary)' }}>
              Neuen Link anfordern
            </a>
          </p>
        </div>
      </main>
    );
  }

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
          Klicken Sie auf die Schaltfläche, um sich anzumelden.
        </p>

        <form action="/verify" method="POST" className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="w-full rounded-[calc(var(--radius)-0.5rem)] px-4 py-2 text-sm font-semibold transition"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Jetzt anmelden
          </button>
        </form>
      </div>
    </main>
  );
}
