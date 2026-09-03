-- gin_trgm_ops below comes from pg_trgm; the index creation fails without it.
-- drizzle-kit does not emit extension statements, so this line is added by hand
-- and must be kept if this migration is ever regenerated.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "idx_listings_tags" ON "listings" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_listings_title_trgm" ON "listings" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_listings_desc_trgm" ON "listings" USING gin ("description" gin_trgm_ops);