import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const listingType = pgEnum('listing_type', ['need', 'offer']);

export const listings = pgTable(
  'listings',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    userId:      text('user_id').notNull(),
    email:       text('email').notNull(),
    type:        listingType('type').notNull(),
    title:       text('title').notNull(),
    description: text('description').notNull(),
    tags:        text('tags').array().notNull().default([]),
    /*
     * One of the names in PLACES (src/lib/geo.ts) — a closed set, enforced by
     * ListingInput, not free text. It is the only geodata this table holds:
     * the coordinates of each place are a constant of that table, so a
     * per-row lat/lng would be a duplicated lookup stored as personal data.
     * The radius filter derives them at query time instead (src/db/filters.ts).
     */
    location:    text('location').notNull(),

    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listings_type_created').on(t.type, t.createdAt.desc()),
    index('idx_listings_user').on(t.userId),
    // Serves the radius filter's `location IN (…)`: with a closed place list
    // the filter is a set of equalities, not a geometric scan.
    index('idx_listings_location').on(t.location),

    /*
     * Serves the category tabs' `tags @> ARRAY[...]`. Without it the planner
     * can only use idx_listings_type_created and then discards the
     * non-matching rows as a filter: on 50k rows that read 25,000 to keep
     * 6,250. A btree cannot answer array containment at all; GIN is the index
     * type for it.
     */
    index('idx_listings_tags').using('gin', t.tags),

    /*
     * Serves the search box. `ILIKE '%q%'` leads with a wildcard, so no btree
     * can be used and every candidate row is matched in the heap -- 25,000
     * read to keep 55 on the same data. Trigram GIN indexes the substrings
     * themselves, which is what makes a leading wildcard indexable.
     * Requires pg_trgm; the migration enables it.
     */
    index('idx_listings_title_trgm').using('gin', sql`${t.title} gin_trgm_ops`),
    index('idx_listings_desc_trgm').using('gin', sql`${t.description} gin_trgm_ops`),

    /*
     * Serves the tag arm of the same search box. The tags are matched as one
     * joined string rather than element by element, because `EXISTS (SELECT 1
     * FROM unnest(tags) ...)` -- the form that says exactly the right thing --
     * is a correlated subquery no index can serve, and one unindexable arm
     * makes the whole OR a sequential scan. src/db/filters.ts keeps the EXISTS
     * as the exact test and uses this index to narrow the rows it runs on.
     *
     * `listing_tags_text` is an IMMUTABLE wrapper around `array_to_string`,
     * created by migration 0004 -- the plain function is only STABLE and so
     * cannot appear in an index expression.
     */
    index('idx_listings_tags_trgm').using(
      'gin',
      sql`listing_tags_text(${t.tags}) gin_trgm_ops`,
    ),
  ],
);

export const magicTokens = pgTable(
  'magic_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    email:     text('email').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumed:  boolean('consumed').default(false).notNull(),
  },
  (t) => [
    index('idx_magic_tokens_email').on(t.email),
    index('idx_magic_tokens_expires').on(t.expiresAt),
  ],
);

export const rateLimits = pgTable(
  'rate_limits',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    key:       text('key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_rate_limits_key_created').on(t.key, t.createdAt)],
);
