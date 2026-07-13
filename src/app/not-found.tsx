import { headers } from 'next/headers';
import Link from 'next/link';

// Reading headers() opts this page into dynamic rendering, so the HTML is
// generated per request and Next's inline bootstrap scripts carry the same
// CSP nonce that src/proxy.ts put on the response header. A statically
// prerendered 404 would embed scripts without the per-request nonce and be
// blocked by the CSP.
export default async function NotFound() {
  await headers();

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
          Seite nicht gefunden
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Die angeforderte Seite existiert nicht.{' '}
          <Link href="/" style={{ color: 'var(--primary)' }}>
            Zur Startseite
          </Link>
        </p>
      </div>
    </main>
  );
}
