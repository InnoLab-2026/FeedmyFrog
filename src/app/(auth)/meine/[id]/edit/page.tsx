import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { getSession } from '@/lib/session';
import type { Listing } from '@/types';
import EditListingForm from './EditListingForm';

export const dynamic = 'force-dynamic';

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSession())!; // layout guarantees session

  const [row] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.userId, session.userId)));

  if (!row) notFound();

  const listing: Listing = {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    tags: row.tags,
    location: row.location,
    email: row.email,
  };

  return (
    <main className="max-w-[800px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontWeight: 700, fontSize: '24px' }}>Eintrag bearbeiten</h1>
        <Link
          href="/meine"
          className="py-2 px-4 rounded-xl"
          style={{ background: 'white', border: '2px solid black', fontWeight: 600 }}
        >
          ← Meine Einträge
        </Link>
      </div>
      <EditListingForm listing={listing} />
    </main>
  );
}
