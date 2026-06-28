import { redirect } from 'next/navigation';
import { desc } from 'drizzle-orm';
import { getSession, destroySession } from '@/lib/session';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import type { Listing } from '@/types';
import Marketplace from '@/components/Marketplace';

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

  const rows = await db
    .select()
    .from(listings)
    .orderBy(desc(listings.createdAt));

  const items: Listing[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags,
    location: r.location,
    email: r.email,
    type: r.type,
  }));

  return <Marketplace listings={items} logoutAction={logout} />;
}
