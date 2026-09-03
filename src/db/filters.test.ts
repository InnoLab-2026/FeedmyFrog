/*
 * The only tests that touch real SQL.
 *
 * The radius filter and the migration that backfills coordinates are the
 * least reviewable part of this feature: a wrong bounding box or a bad
 * regular expression in the backfill fails silently, as listings that quietly
 * stop appearing. So they run here against a real Postgres engine (pglite,
 * in-process — no server, no fixtures to maintain) rather than against a
 * mocked query builder that would happily accept nonsense.
 *
 * The migrations are applied in the order drizzle-kit recorded, so a new one
 * is picked up without touching this file.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { drizzle } from 'drizzle-orm/pglite';
import { and, eq } from 'drizzle-orm';

import { listings } from './schema';
import { resolvePlaceParam, withinRadius } from './filters';
import { CITY_COORDS, haversineKm } from '@/lib/geo';

/*
 * pg_trgm is loaded explicitly: pglite ships contrib extensions but enables
 * none of them by default, and drizzle/0002 creates the trigram indexes that
 * make the search box's leading-wildcard ILIKE indexable. Without it the
 * migration loop below fails on that file, which is exactly the signal this
 * suite exists to give -- a migration that will not apply.
 */
const client = new PGlite({ extensions: { pg_trgm } });
const db = drizzle(client, { schema: { listings } });

/** Migration file names in the order drizzle-kit recorded them. */
function migrationFiles(): string[] {
  const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
  return journal.entries.map((entry: { tag: string }) => `drizzle/${entry.tag}.sql`);
}

const BACKFILL_MARKER = 'WITH places';

beforeAll(async () => {
  for (const file of migrationFiles()) {
    const sql = readFileSync(file, 'utf8');
    for (const stmt of sql.split('--> statement-breakpoint')) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }

  // Rows written before the coordinate columns existed: location text only.
  await client.exec(`
    INSERT INTO listings (user_id, email, type, title, description, location) VALUES
      ('u', 'a@x.de', 'offer', 'In Reutlingen', 'desc', 'Reutlingen'),
      ('u', 'a@x.de', 'offer', 'With postcode', 'desc', '72762 Reutlingen'),
      ('u', 'a@x.de', 'offer', 'In Pfullingen', 'desc', 'Pfullingen'),
      ('u', 'a@x.de', 'offer', 'In Stuttgart', 'desc', 'Stuttgart'),
      ('u', 'a@x.de', 'offer', 'In Goeppingen', 'desc', 'Göppingen'),
      ('u', 'a@x.de', 'offer', 'Unplaceable', 'desc', 'bei mir zu Hause'),
      ('u', 'a@x.de', 'offer', 'Long name', 'desc', 'Kirchentellinsfurt');
  `);

  /*
   * The rows above were inserted after the migration ran, so re-run just the
   * backfill statement over them. That is exactly what the migration does to
   * the rows already in production, which is the thing worth testing.
   */
  const backfill = migrationFiles()
    .map((file) => readFileSync(file, 'utf8'))
    .find((sql) => sql.includes(BACKFILL_MARKER));

  if (!backfill) throw new Error('no backfill statement found in the migrations');
  await client.exec(backfill.slice(backfill.indexOf(BACKFILL_MARKER)));
});

async function titlesNear(place: string, radiusKm: number) {
  const rows = await db
    .select({ title: listings.title })
    .from(listings)
    .where(and(eq(listings.type, 'offer'), withinRadius(place, radiusKm)));
  return rows.map((r) => r.title).sort();
}

describe('migration backfill', () => {
  it('places every row whose location names somewhere known', async () => {
    const rows = await db
      .select({ title: listings.title, lat: listings.lat, lng: listings.lng })
      .from(listings);

    const byTitle = Object.fromEntries(rows.map((r) => [r.title, r]));

    expect(byTitle['In Reutlingen'].lat).toBeCloseTo(CITY_COORDS.Reutlingen.lat, 4);
    expect(byTitle['With postcode'].lat).toBeCloseTo(CITY_COORDS.Reutlingen.lat, 4);
    expect(byTitle['In Stuttgart'].lat).toBeCloseTo(CITY_COORDS.Stuttgart.lat, 4);
    expect(byTitle['In Goeppingen'].lat).toBeCloseTo(CITY_COORDS['Göppingen'].lat, 4);
    expect(byTitle['Long name'].lat).toBeCloseTo(CITY_COORDS.Kirchentellinsfurt.lat, 4);
  });

  it('leaves an unplaceable location null instead of guessing', async () => {
    const [row] = await db
      .select({ lat: listings.lat })
      .from(listings)
      .where(eq(listings.title, 'Unplaceable'));
    expect(row.lat).toBeNull();
  });
});

describe('withinRadius (real SQL)', () => {
  it('finds listings in the place itself', async () => {
    expect(await titlesNear('Reutlingen', 3)).toEqual(['In Reutlingen', 'With postcode']);
  });

  it('widens with the radius', async () => {
    // Pfullingen is ~3.2 km from Reutlingen.
    expect(await titlesNear('Reutlingen', 5)).toContain('In Pfullingen');
    expect(await titlesNear('Reutlingen', 3)).not.toContain('In Pfullingen');
  });

  it('excludes a place beyond the radius', async () => {
    // Stuttgart is ~31 km away, so it is out at 20 km.
    expect(await titlesNear('Reutlingen', 20)).not.toContain('In Stuttgart');
  });

  it('never returns a row with no coordinates', async () => {
    for (const radius of [3, 5, 10, 20]) {
      expect(await titlesNear('Reutlingen', radius)).not.toContain('Unplaceable');
    }
  });

  it('agrees with the JavaScript distance calculation on every row', async () => {
    const all = await db
      .select({ title: listings.title, lat: listings.lat, lng: listings.lng })
      .from(listings);

    for (const place of ['Reutlingen', 'Stuttgart', 'Tübingen']) {
      for (const radius of [3, 5, 10, 20]) {
        const centre = CITY_COORDS[place];
        const expected = all
          .filter((r) => r.lat !== null && r.lng !== null)
          .filter((r) => haversineKm(centre.lat, centre.lng, r.lat!, r.lng!) <= radius)
          .map((r) => r.title)
          .sort();

        expect(await titlesNear(place, radius), `${place} @ ${radius}km`).toEqual(expected);
      }
    }
  });

  it('applies no filter for a place we do not know', async () => {
    expect(withinRadius('Hamburg', 10)).toBeUndefined();
  });
});

describe('resolvePlaceParam', () => {
  it('accepts a place we know', () => {
    expect(resolvePlaceParam('Reutlingen')).toBe('Reutlingen');
  });

  it('is case- and whitespace-insensitive, returning the canonical name', () => {
    expect(resolvePlaceParam('  tÜBINGEN ')).toBe('Tübingen');
  });

  it('rejects a place we do not know, so the filter is simply not applied', () => {
    expect(resolvePlaceParam('Hamburg')).toBeNull();
  });

  it('rejects an absent or empty parameter', () => {
    expect(resolvePlaceParam(undefined)).toBeNull();
    expect(resolvePlaceParam('')).toBeNull();
    expect(resolvePlaceParam('   ')).toBeNull();
  });

  it('does not resolve a partial name', () => {
    // The URL is untrusted input; only an exact known place gets through.
    expect(resolvePlaceParam('Reut')).toBeNull();
    expect(resolvePlaceParam('Reutlingen ')).toBe('Reutlingen');
  });
});
