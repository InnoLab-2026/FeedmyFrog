import { desc } from 'drizzle-orm';

import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { requireSession } from '@/lib/session';

import type { Listing } from '@/types';
import SavedListingsPageContent from '@/components/marketplace/SavedListingsPageContent';

export const dynamic = 'force-dynamic';

export default async function SavedListingsPage() {
  const session = await requireSession();

  const rows = await db
    .select()
    .from(listings)
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
    <SavedListingsPageContent
      data={data}
      email={session.email}
    />
  );
}