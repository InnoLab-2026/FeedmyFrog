import { redirect } from 'next/navigation';
import { getSession, destroySession } from '@/lib/session';

// Middleware already gates this route, but we re-check so the page never renders
// without a session (defence in depth) and so `session` is typed non-null below.
export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  async function logout() {
    'use server';
    await destroySession();
    redirect('/login');
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <header className="flex items-center justify-between">
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--foreground)', fontFamily: 'var(--font-family-display)' }}
        >
          Reutlingen University Connect
        </h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-[calc(var(--radius)-0.5rem)] px-3 py-1.5 text-sm font-medium"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            Abmelden
          </button>
        </form>
      </header>

      <section
        className="mt-6 rounded-[var(--radius)] p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Angemeldet als
        </p>
        <p className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
          {session.email}
        </p>
        <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Der Marktplatz (Suchen &amp; Angebote) wird hier erscheinen. Dieser
          Bereich ist nur nach erfolgreicher Anmeldung erreichbar.
        </p>
      </section>
    </main>
  );
}
