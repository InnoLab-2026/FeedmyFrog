import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { requireSession } from '@/lib/session';
import type { Listing } from '@/types';
import EditListingForm from './EditListingForm';
import EditListingPageHeader from './EditListingPageHeader';

export const dynamic = 'force-dynamic';

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

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
      <EditListingPageHeader />
      <EditListingForm listing={listing} />
    </main>
  );
}
