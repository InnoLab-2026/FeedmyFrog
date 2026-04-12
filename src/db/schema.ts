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
    location:    text('location').notNull(),
    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_listings_type_created').on(t.type, t.createdAt.desc()),
    index('idx_listings_user').on(t.userId),
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
