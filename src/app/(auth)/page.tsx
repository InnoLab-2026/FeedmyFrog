import {
  and,
  arrayContains,
  desc,
  eq,
  sql,
} from 'drizzle-orm';

import { db } from '@/db/client';
import { listings } from '@/db/schema';
import { requireSession } from '@/lib/session';
import { DEFAULT_RADIUS_KM, isRadius } from '@/lib/geo';
import {
  categoryCountColumns,
  matchesQuery,
  resolvePlaceParam,
  withinRadius,
} from '@/db/filters';
import { rankCategories } from '@/data/categories';

import type { Listing, Mode } from '@/types';
import Marketplace from '@/components/Marketplace';

export const dynamic = 'force-dynamic';

const PER_PAGE_OPTIONS = [15, 30, 50] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    cat?: string;
    q?: string;
    page?: string;
    per?: string;
    loc?: string;
    r?: string;
    near?: string;
  }>;
}) {
  const session = await requireSession();

  const params = await searchParams;

  const mode: Mode =
    params.mode === 'offer' ? 'offer' : 'need';

  const category = (params.cat ?? 'All').slice(0, 40);
  const query = (params.q ?? '').trim().slice(0, 200);

  const perPage =
    PER_PAGE_OPTIONS.find(
      (n) => n === Number(params.per),
    ) ?? 15;

  const requestedPage = Math.max(
    1,
    Math.floor(Number(params.page)) || 1,
  );

  const place = resolvePlaceParam(params.loc);

  const radiusKm = isRadius(Number(params.r))
    ? Number(params.r)
    : DEFAULT_RADIUS_KM;

  // Display-only: remembers that the place came from a GPS fix, so the
  // control can keep saying "Near X" across a navigation.
  const approximate = params.near === '1';

  const where = and(
    eq(listings.type, mode),

    category !== 'All'
      ? arrayContains(listings.tags, [category])
      : undefined,

    query ? matchesQuery(query) : undefined,

    place ? withinRadius(place, radiusKm) : undefined,
  );

  /*
   * One HTTP request, not two.
   *
   * neon-http opens a fresh HTTPS request per query, so each `await db...`
   * is a full round trip to Postgres. Fetching the page of rows after the
   * count -- which is what the clamp below needs -- made that a two-wave
   * waterfall: the rows could not even be asked for until the count came
   * back. `db.batch` sends both as one non-interactive transaction, so the
   * wire cost is a single round trip and the rows arrive with the count
   * rather than after it.
   *
   * The rows are fetched at the *requested* page, because the clamp is not
   * known yet. That is the right guess for every in-range page, which is
   * every normal navigation; only an out-of-range `?page=` needs the second
   * query below.
   */
  const [[{ count }], requestedRows, [categoryCounts]] = await db.batch([
    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(listings)
      .where(where),

    db
      .select()
      .from(listings)
      .where(where)
      .orderBy(desc(listings.createdAt))
      .limit(perPage)
      .offset((requestedPage - 1) * perPage),

    /*
     * The tab order, counted over the mode alone rather than over `where`.
     *
     * Ranking within the filtered set would reorder the strip as the reader
     * types in the search box, and picking a category would re-sort the row
     * the pointer is already in. The tabs answer "what is there to look at
     * in Suche" -- a property of the mode -- so narrowing must not change
     * them. It rides along in the batch, so it costs no extra round trip.
     */
    db
      .select(categoryCountColumns())
      .from(listings)
      .where(eq(listings.type, mode)),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(count / perPage),
  );

  const page = Math.min(
    requestedPage,
    totalPages,
  );

  // Only when `?page=` pointed past the end: re-fetch at the clamped page.
  const rows =
    page === requestedPage
      ? requestedRows
      : await db
          .select()
          .from(listings)
          .where(where)
          .orderBy(desc(listings.createdAt))
          .limit(perPage)
          .offset((page - 1) * perPage);

  const categoryOrder = rankCategories(categoryCounts);

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
      categoryOrder={categoryOrder}
      query={query}
      email={session.email}
      place={place}
      radiusKm={radiusKm}
      approximate={approximate}
    />
  );
}