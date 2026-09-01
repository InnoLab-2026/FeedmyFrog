ALTER TABLE "listings" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "lng" double precision;--> statement-breakpoint
CREATE INDEX "idx_listings_coords" ON "listings" USING btree ("lat","lng");
--> statement-breakpoint
/*
 * Backfill: place the listings that already exist.
 *
 * Without this every row written before the columns existed has NULL
 * coordinates, and a radius filter would return nothing at all on a database
 * that is full of listings. Matching mirrors resolveLocation() in
 * src/lib/geo.ts — the exact name, or the name as a whole word inside the
 * free text ("72762 Reutlingen") — and the longest match wins so
 * "Kirchentellinsfurt" is not matched by a shorter name inside it.
 *
 * Rows whose location names somewhere unknown keep NULL coordinates and are
 * simply absent from radius-filtered results, which is the honest answer.
 */
WITH places (name, lat, lng) AS (
  VALUES
    ('Reutlingen', 48.4914, 9.2042),
    ('Betzingen', 48.5089, 9.1756),
    ('Sondelfingen', 48.508, 9.233),
    ('Oferdingen', 48.526, 9.24),
    ('Gönningen', 48.43, 9.15),
    ('Degerschlacht', 48.515, 9.168),
    ('Mössingen', 48.4064, 9.0542),
    ('Pfullingen', 48.4644, 9.2261),
    ('Eningen', 48.486, 9.255),
    ('Wannweil', 48.515, 9.15),
    ('Kirchentellinsfurt', 48.531, 9.147),
    ('Stuttgart', 48.7758, 9.1829),
    ('Tübingen', 48.5216, 9.0576),
    ('Esslingen', 48.7394, 9.3068),
    ('Ludwigsburg', 48.8975, 9.1916),
    ('Waiblingen', 48.8302, 9.3189),
    ('Böblingen', 48.6831, 9.0107),
    ('Sindelfingen', 48.7155, 9.0018),
    ('Göppingen', 48.703, 9.6531),
    ('Fellbach', 48.8132, 9.2755)
), matched AS (
  SELECT DISTINCT ON (l.id) l.id, p.lat, p.lng
  FROM listings l
  JOIN places p
    ON lower(l.location) = lower(p.name)
    OR l.location ~* ('(^|[^[:alnum:]])' || p.name || '([^[:alnum:]]|$)')
  ORDER BY l.id, length(p.name) DESC
)
UPDATE listings
SET lat = matched.lat, lng = matched.lng
FROM matched
WHERE listings.id = matched.id
  AND listings.lat IS NULL;
