import { desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { requireSession } from '@/lib/session';

import type { Listing } from '@/types';

import MyListingsPageContent from '@/components/marketplace/MyListingsPageContent';

export const dynamic = 'force-dynamic';

export default async function MeinePage() {
  const session = await requireSession();

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
    <MyListingsPageContent
      data={data}
      email={session.email}
    />
  );
}