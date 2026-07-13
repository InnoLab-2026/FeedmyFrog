import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import type { Listing } from '@/types';
import Marketplace from '@/components/Marketplace';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const rows = await db
    .select()
    .from(listings)
    .orderBy(desc(listings.createdAt))
    .limit(500);

  const items: Listing[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    tags: r.tags,
    location: r.location,
    email: r.email,
  }));

  return <Marketplace listings={items} />;
}
