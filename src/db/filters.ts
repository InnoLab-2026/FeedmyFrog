import { and, ilike, inArray, or, sql } from 'drizzle-orm';

import { listings } from './schema';
import { PLACES, isPlace, placesWithin } from '@/lib/geo';
import { STANDARD_CATEGORY_TAGS } from '@/data/categories';

/**
 * Restricts a listings query to rows whose location is within `radiusKm` of a
 * named place.
 *
 * Because `listings.location` is a closed set of twenty names, "near here" is
 * a question about *names*: placesWithin() does twenty great-circle distances
 * in memory, once per request, and the database is asked for a plain
 * `location IN (…)`. No coordinate is stored per row, no bounding box is
 * scanned, and no trigonometry runs inside Postgres.
 *
 * The place arrives as a name and is validated against the same table rather
 * than trusted, so a crafted link cannot ask about an arbitrary point. An
 * unknown name returns undefined, which drizzle's `and()` drops — the filter
 * is simply not applied rather than silently matching nothing.
 */
export function withinRadius(place: string, radiusKm: number) {
  const nearby = placesWithin(place, radiusKm);
  if (nearby.length === 0) return undefined;

  return inArray(listings.location, nearby);
}

/**
 * Escapes the three characters ILIKE treats as syntax, then wraps the term in
 * wildcards. Without the escape a search for `100%` matches every row and a
 * search for `_` matches all of them one character at a time.
 */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, '\\$&')}%`;
}

/**
 * Restricts a listings query to rows whose title, description or any one tag
 * contains `query` as a substring, case-insensitively.
 *
 * The tag arm is written as two conjuncts, and the pair is deliberate.
 *
 * `EXISTS (SELECT 1 FROM unnest(tags) …)` says exactly the right thing but is
 * a correlated subquery: no index can serve it, so a search containing it is a
 * sequential scan of the whole table however the other arms are indexed --
 * which is the cost `idx_listings_title_trgm` and `idx_listings_desc_trgm`
 * exist to avoid (see the note on them in schema.ts).
 *
 * So the tags are also matched as one string, `listing_tags_text(tags)`, which
 * a trigram GIN index *can* serve. That form is a strict superset of the
 * EXISTS: a substring of any single element is necessarily a substring of the
 * elements joined together. The converse does not hold -- joining ['musik',
 * 'mathe'] yields `musik mathe`, which contains `ik ma` while neither tag
 * does -- so the EXISTS stays as the exact test. `A AND B` where `A` is a
 * superset of `B` is just `B`, so the semantics are the EXISTS's; the planner
 * gets to start from the index and only evaluates the subquery on the handful
 * of rows the index already narrowed it to.
 */
export function matchesQuery(query: string) {
  const pattern = likePattern(query);

  return or(
    ilike(listings.title, pattern),
    ilike(listings.description, pattern),
    and(
      sql`listing_tags_text(${listings.tags}) ilike ${pattern}`,
      sql`exists (
        select 1 from unnest(${listings.tags}) as tag
        where tag ilike ${pattern}
      )`,
    ),
  );
}

/** The place name from a URL parameter, only if it is one we actually know. */
export function resolvePlaceParam(value: string | undefined): string | null {
  if (!value) return null;

  const needle = value.trim().toLowerCase();
  const match = PLACES.find((place) => place.toLowerCase() === needle);

  return match ?? null;
}

export { isPlace };

/**
 * Select shape counting, per built-in category, the listings of one mode
 * that carry it. Ranked by `rankCategories` into the order of the tab strip.
 *
 * A select *shape* rather than a query, for the same reason `cleanupRateLimits`
 * is a builder: the caller owns the connection and can put this in the
 * `db.batch` it was already sending, so the tab order costs no round trip of
 * its own. Over neon-http a separate await would cost a full one.
 *
 * One pass, nine counters. This replaces an `unnest(tags) … GROUP BY 1` that
 * ranked every tag in use, and is cheaper than it in a way that matters at
 * size: the aggregate is bounded by the number of built-in categories, not
 * by the number of distinct tags in the table, and no row is expanded into
 * one output row per tag on the way through. A listing carrying eight
 * hashtags costs exactly what a listing carrying one costs.
 *
 * The tag is bound as a parameter, not interpolated. These are compile-time
 * constants today, but a category list that later comes from anywhere else
 * must not be able to reach the SQL text.
 */
export function categoryCountColumns() {
  return Object.fromEntries(
    STANDARD_CATEGORY_TAGS.map((tag) => [
      tag,
      sql<number>`(count(*) filter (where ${listings.tags} @> array[${tag}]::text[]))::int`,
    ]),
  );
}
