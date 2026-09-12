-- Makes the tag arm of the search box indexable.
--
-- `array_to_string` is only STABLE in the catalogue -- an array's element
-- output function need not be immutable in general -- so it cannot appear in an
-- index expression. This wrapper is pinned to text[], where the conversion
-- really is immutable, and declares that; which is what lets the index exist.
--
-- Like the CREATE EXTENSION line in 0002, drizzle-kit does not emit function
-- definitions, so this statement is added by hand and must be kept if this
-- migration is ever regenerated.
CREATE OR REPLACE FUNCTION listing_tags_text(text[])
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  RETURNS NULL ON NULL INPUT
  AS $$ SELECT array_to_string($1, ' ') $$;--> statement-breakpoint
CREATE INDEX "idx_listings_tags_trgm" ON "listings" USING gin (listing_tags_text("tags") gin_trgm_ops);
