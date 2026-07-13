import { and, arrayContains, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { requireSession } from '@/lib/session';
import type { Listing, Mode } from '@/types';
import Marketplace from '@/components/Marketplace';

export const dynamic = 'force-dynamic';

const PER_PAGE_OPTIONS = [15, 30, 50] as const;

// Escape LIKE wildcards so user input matches literally.
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, '\\$&')}%`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; cat?: string; q?: string; page?: string; per?: string }>;
}) {
  await requireSession();

  const params = await searchParams;
  const mode: Mode = params.mode === 'offer' ? 'offer' : 'need';
  const category = (params.cat ?? 'All').slice(0, 40);
  const query = (params.q ?? '').trim().slice(0, 200);
  const perPage = PER_PAGE_OPTIONS.find((n) => n === Number(params.per)) ?? 15;
  const requestedPage = Math.max(1, Math.floor(Number(params.page)) || 1);

  const where = and(
    eq(listings.type, mode),
    category !== 'All' ? arrayContains(listings.tags, [category]) : undefined,
    query
      ? or(
          ilike(listings.title, likePattern(query)),
          ilike(listings.description, likePattern(query)),
        )
      : undefined,
  );

  // Total count (for page clamping) and the category tabs (tag frequencies
  // within the current mode, matching the previous client-side derivation)
  // are independent — fetch them in parallel, then the clamped page slice.
  const [[{ count }], tagRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(listings).where(where),
    db
      .select({ tag: sql<string>`unnest(${listings.tags})`, count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.type, mode))
      .groupBy(sql`1`)
      .orderBy(sql`2 DESC`),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / perPage));
  const page = Math.min(requestedPage, totalPages);

  const rows = await db
    .select()
    .from(listings)
    .where(where)
    .orderBy(desc(listings.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const items: Listing[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    tags: r.tags,
    location: r.location,
    email: r.email,
  }));

  return (
    <Marketplace
      listings={items}
      totalCount={count}
      page={page}
      perPage={perPage}
      mode={mode}
      category={category}
      query={query}
      categoryTags={tagRows.map((r) => r.tag)}
    />
  );
}
