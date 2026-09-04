import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
  doublePrecision,
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
    location:    text('location').notNull(),

    /*
     * Coordinates of the place `location` names, filled in on write by
     * resolveLocation() in src/lib/geo.ts. Nullable because the field is free
     * text: a listing may name somewhere we cannot place, and such a row is
     * simply not returned by a radius filter rather than being guessed at.
     */
    lat:         doublePrecision('lat'),
    lng:         doublePrecision('lng'),

    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listings_type_created').on(t.type, t.createdAt.desc()),
    index('idx_listings_user').on(t.userId),
    // Narrows the bounding-box scan the radius filter starts with.
    index('idx_listings_coords').on(t.lat, t.lng),

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
