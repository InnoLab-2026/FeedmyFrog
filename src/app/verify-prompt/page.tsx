import type { Metadata } from 'next';
import { CARD_SHADOW } from '@/constants';

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
      <main className="flex min-h-screen items-center justify-center p-6" style={{ background: '#f5f5f5' }}>
        <div
          className="w-full max-w-md p-8 rounded-2xl"
          style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
        >
          <h1
            style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, fontSize: '24px', color: 'black' }}
          >
            Ungültiger Link
          </h1>
          <p
            role="alert"
            className="mt-4 p-3 rounded-xl"
            style={{ border: '2px solid black', color: 'red', fontSize: '14px', fontWeight: 600, background: 'white' }}
          >
            Der Anmeldelink war unvollständig.
          </p>
          <p className="mt-4" style={{ fontSize: '14px', fontWeight: 500, color: 'black' }}>
            <a
              href="/login"
              className="hover:underline"
              style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
            >
              Neuen Link anfordern
            </a>
          </p>
        </div>
      </main>
    );
  }

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
          Klicken Sie auf die Schaltfläche, um sich anzumelden.
        </p>

        <form action="/verify" method="POST" className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="w-full py-3 rounded-xl transition"
            style={{ background: 'black', color: 'white', fontWeight: 600 }}
          >
            Jetzt anmelden
          </button>
        </form>
      </div>
    </main>
  );
}
