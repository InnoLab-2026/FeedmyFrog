/*
 * The only tests that touch real SQL.
 *
 * The radius filter and the migration that normalises legacy location text
 * are the least reviewable part of this feature: a wrong `IN` list or a bad
 * regular expression in the normalisation fails silently, as listings that
 * quietly stop appearing. So they run here against a real Postgres engine
 * (pglite, in-process — no server, no fixtures to maintain) rather than
 * against a mocked query builder that would happily accept nonsense.
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
import { PLACES, placesWithin } from '@/lib/geo';

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

/*
 * Identifies 0003's normalisation specifically. `WITH places` alone would also
 * match 0001's coordinate backfill, which references columns 0003 drops — so
 * the marker is the line only the normalisation has.
 */
const NORMALISE_MARKER = 'SET location = matched.name';
const CTE_START = 'WITH places';
const BREAKPOINT = '--> statement-breakpoint';

/**
 * 0003's normalisation statement, on its own, to re-run over new rows.
 *
 * Bounded at both ends. Slicing only from `WITH places` to the end of the
 * file would drag in the DROP INDEX and DROP COLUMN statements that follow
 * it, and re-running those against an already-migrated database fails.
 */
function normalisationStatement(): string {
  const sql = migrationFiles()
    .map((file) => readFileSync(file, 'utf8'))
    .find((text) => text.includes(NORMALISE_MARKER));

  if (!sql) throw new Error('no normalisation statement found in the migrations');

  const start = sql.indexOf(CTE_START);
  const end = sql.indexOf(BREAKPOINT, start);

  return end === -1 ? sql.slice(start) : sql.slice(start, end);
}

beforeAll(async () => {
  for (const file of migrationFiles()) {
    const sql = readFileSync(file, 'utf8');
    for (const stmt of sql.split(BREAKPOINT)) {
      if (stmt.trim()) await client.exec(stmt);
    }
  }

  // Rows as they looked while `location` was still free text.
  await client.exec(`
    INSERT INTO listings (user_id, email, type, title, description, location) VALUES
      ('u', 'a@x.de', 'offer', 'Canonical', 'desc', 'Reutlingen'),
      ('u', 'a@x.de', 'offer', 'With postcode', 'desc', '72762 Reutlingen'),
      ('u', 'a@x.de', 'offer', 'With prefix', 'desc', 'Campus Reutlingen'),
      ('u', 'a@x.de', 'offer', 'Two names', 'desc', 'Reutlingen-Betzingen'),
      ('u', 'a@x.de', 'offer', 'In Pfullingen', 'desc', 'Pfullingen'),
      ('u', 'a@x.de', 'offer', 'In Stuttgart', 'desc', 'Stuttgart'),
      ('u', 'a@x.de', 'offer', 'In Goeppingen', 'desc', 'Göppingen'),
      ('u', 'a@x.de', 'offer', 'Long name', 'desc', 'Kirchentellinsfurt'),
      ('u', 'a@x.de', 'offer', 'Unplaceable', 'desc', 'bei mir zu Hause'),
      ('u', 'a@x.de', 'offer', 'Street address', 'desc', 'Musterweg 12, 70173');
  `);

  /*
   * The rows above were inserted after the migration ran, so re-run just the
   * normalisation over them. That is exactly what the migration does to the
   * rows already in production, which is the thing worth testing.
   */
  await client.exec(normalisationStatement());
});

async function locationOf(title: string): Promise<string> {
  const [row] = await db
    .select({ location: listings.location })
    .from(listings)
    .where(eq(listings.title, title));
  return row.location;
}

async function titlesNear(place: string, radiusKm: number) {
  const rows = await db
    .select({ title: listings.title })
    .from(listings)
    .where(and(eq(listings.type, 'offer'), withinRadius(place, radiusKm)));
  return rows.map((r) => r.title).sort();
}

describe('the coordinate columns are gone', () => {
  it('listings has no lat or lng column after the migrations', async () => {
    const result = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'listings'`,
    );
    const columns = result.rows.map((r) => r.column_name);

    expect(columns).not.toContain('lat');
    expect(columns).not.toContain('lng');
    expect(columns).toContain('location');
  });
});

describe('migration 0003 normalisation', () => {
  it('leaves a location that is already canonical alone', async () => {
    expect(await locationOf('Canonical')).toBe('Reutlingen');
    expect(await locationOf('In Pfullingen')).toBe('Pfullingen');
    expect(await locationOf('In Goeppingen')).toBe('Göppingen');
  });

  it('strips the postcode and any other text around a known name', async () => {
    expect(await locationOf('With postcode')).toBe('Reutlingen');
    expect(await locationOf('With prefix')).toBe('Reutlingen');
  });

  it('picks the longest name when the text holds two', async () => {
    expect(await locationOf('Two names')).toBe('Reutlingen');
  });

  it('is not fooled by a shorter name inside a longer one', async () => {
    expect(await locationOf('Long name')).toBe('Kirchentellinsfurt');
  });

  it('leaves text that names nowhere we know untouched, rather than guessing', async () => {
    expect(await locationOf('Unplaceable')).toBe('bei mir zu Hause');
    expect(await locationOf('Street address')).toBe('Musterweg 12, 70173');
  });

  it('leaves every other row holding a name from the closed set', async () => {
    const rows = await db
      .select({ title: listings.title, location: listings.location })
      .from(listings);

    const unnormalised = rows
      .filter((r) => !(PLACES as readonly string[]).includes(r.location))
      .map((r) => r.title)
      .sort();

    expect(unnormalised).toEqual(['Street address', 'Unplaceable']);
  });
});

describe('withinRadius (real SQL)', () => {
  it('finds listings in the place itself', async () => {
    expect(await titlesNear('Reutlingen', 3)).toEqual([
      'Canonical',
      'Two names',
      'With postcode',
      'With prefix',
    ]);
  });

  it('widens with the radius', async () => {
    // Pfullingen is ~3.4 km from Reutlingen.
    expect(await titlesNear('Reutlingen', 5)).toContain('In Pfullingen');
    expect(await titlesNear('Reutlingen', 3)).not.toContain('In Pfullingen');
  });

  it('excludes a place beyond the radius', async () => {
    // Stuttgart is ~31 km away, so it is out at 20 km.
    expect(await titlesNear('Reutlingen', 20)).not.toContain('In Stuttgart');
  });

  it('never returns a row whose location is not in the closed set', async () => {
    for (const radius of [3, 5, 10, 20]) {
      const titles = await titlesNear('Reutlingen', radius);
      expect(titles).not.toContain('Unplaceable');
      expect(titles).not.toContain('Street address');
    }
  });

  it('agrees with placesWithin on every place and radius', async () => {
    const all = await db
      .select({ title: listings.title, location: listings.location })
      .from(listings);

    for (const place of PLACES) {
      for (const radius of [3, 5, 10, 20]) {
        const nearby = placesWithin(place, radius) as readonly string[];
        const expected = all
          .filter((r) => nearby.includes(r.location))
          .map((r) => r.title)
          .sort();

        expect(await titlesNear(place, radius), `${place} @ ${radius}km`).toEqual(
          expected,
        );
      }
    }
  });

  it('applies no filter for a place we do not know', () => {
    expect(withinRadius('Hamburg', 10)).toBeUndefined();
  });

  it('applies no filter for a coordinate pair smuggled into the URL', () => {
    expect(withinRadius('48.49731, 9.20427', 10)).toBeUndefined();
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
