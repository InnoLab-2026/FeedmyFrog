import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { getSession } from '@/lib/session';
import { logout } from '@/actions/auth';
import { deleteListing } from '@/actions/listings';
import type { Listing } from '@/types';
import ListingCard from '@/components/marketplace/ListingCard';

export const dynamic = 'force-dynamic';

export default async function MeinePage() {
  const session = (await getSession())!; // layout guarantees session

  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.userId, session.userId))
    .orderBy(desc(listings.createdAt));

  const data: Listing[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    tags: r.tags,
    location: r.location,
    email: r.email,
  }));

  return (
    <main className="max-w-[1400px] mx-auto px-5 py-8">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: '24px' }}>Meine Einträge</h1>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>{session.email}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/"
            className="py-2 px-4 rounded-xl"
            style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}
          >
            Marktplatz
          </Link>
          <Link
            href="/new"
            className="py-2 px-4 rounded-xl"
            style={{ background: 'black', color: 'white', fontWeight: 600 }}
          >
            + Neuer Eintrag
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl"
              style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      {data.length === 0 ? (
        <p className="py-12 text-center" style={{ fontSize: '15px' }}>
          Sie haben noch keine Einträge.{' '}
          <Link href="/new" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            Jetzt erstellen
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {data.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              ownerActions={
                <div className="flex gap-2">
                  <Link
                    href={`/meine/${listing.id}/edit`}
                    className="py-2 px-4 rounded-xl"
                    style={{
                      background: 'white',
                      border: '2px solid black',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    Bearbeiten
                  </Link>
                  <form action={deleteListing}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl"
                      style={{
                        background: 'white',
                        border: '2px solid black',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      Löschen
                    </button>
                  </form>
                </div>
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
