import { headers } from 'next/headers';
import Link from 'next/link';
import { CARD_SHADOW } from '@/constants';

// Reading headers() opts this page into dynamic rendering, so the HTML is
// generated per request and Next's inline bootstrap scripts carry the same
// CSP nonce that src/proxy.ts put on the response header. A statically
// prerendered 404 would embed scripts without the per-request nonce and be
// blocked by the CSP.
export default async function NotFound() {
  await headers();

  return (
    <main className="flex min-h-screen items-center justify-center p-6" style={{ background: '#f5f5f5' }}>
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'white', border: '2px solid black', boxShadow: CARD_SHADOW }}
      >
        <h1
          style={{ fontFamily: 'var(--font-family-display)', fontWeight: 700, fontSize: '24px', color: 'black' }}
        >
          Seite nicht gefunden
        </h1>
        <p className="mt-2" style={{ fontSize: '14px', fontWeight: 500, color: 'black' }}>
          Die angeforderte Seite existiert nicht.{' '}
          <Link
            href="/"
            className="hover:underline"
            style={{ color: 'black', fontWeight: 700, textDecoration: 'underline' }}
          >
            Zur Startseite
          </Link>
        </p>
      </div>
    </main>
  );
}
