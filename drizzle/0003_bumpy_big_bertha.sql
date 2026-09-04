/*
 * Location becomes a closed set.
 *
 * `listings.location` used to be free text that resolveLocation() placed onto
 * coordinates stored per row. It is now one of the twenty names in PLACES
 * (src/lib/geo.ts), enforced by ListingInput before any write, and the lat/lng
 * columns are dropped: the coordinates of each place are a constant of that
 * table, so keeping a copy per row duplicated a lookup as stored personal
 * data. The radius filter derives them at query time instead.
 *
 * Existing rows are normalised to the canonical name first, using the same
 * matching rule the old 0001 backfill used -- the exact name, or the name as a
 * whole word inside the free text ("72762 Reutlingen") -- with the longest
 * match winning so "Kirchentellinsfurt" is not matched by a shorter name
 * inside it. This both keeps those rows inside the radius filter and strips
 * whatever else the author had typed around the place name.
 *
 * Rows whose text names nowhere we know are deliberately LEFT ALONE. Rewriting
 * or deleting somebody's listing is an operator's decision, not a migration's.
 * To see what is left afterwards:
 *
 *   SELECT id, location FROM listings
 *    WHERE location NOT IN (
 *      'Reutlingen','Betzingen','Sondelfingen','Oferdingen','Gönningen',
 *      'Degerschlacht','Mössingen','Pfullingen','Eningen','Wannweil',
 *      'Kirchentellinsfurt','Stuttgart','Tübingen','Esslingen','Ludwigsburg',
 *      'Waiblingen','Böblingen','Sindelfingen','Göppingen','Fellbach');
 *
 * Those listings still render and are still editable; the edit form's <select>
 * simply starts empty, so saving one normalises it.
 */
WITH places (name) AS (
  VALUES
    ('Reutlingen'), ('Betzingen'), ('Sondelfingen'), ('Oferdingen'),
    ('Gönningen'), ('Degerschlacht'), ('Mössingen'), ('Pfullingen'),
    ('Eningen'), ('Wannweil'), ('Kirchentellinsfurt'), ('Stuttgart'),
    ('Tübingen'), ('Esslingen'), ('Ludwigsburg'), ('Waiblingen'),
    ('Böblingen'), ('Sindelfingen'), ('Göppingen'), ('Fellbach')
), matched AS (
  SELECT DISTINCT ON (l.id) l.id, p.name
  FROM listings l
  JOIN places p
    ON lower(l.location) = lower(p.name)
    OR l.location ~* ('(^|[^[:alnum:]])' || p.name || '([^[:alnum:]]|$)')
  ORDER BY l.id, length(p.name) DESC
)
UPDATE listings
SET location = matched.name
FROM matched
WHERE listings.id = matched.id
  AND listings.location <> matched.name;--> statement-breakpoint
DROP INDEX "idx_listings_coords";--> statement-breakpoint
CREATE INDEX "idx_listings_location" ON "listings" USING btree ("location");--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "lat";--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "lng";