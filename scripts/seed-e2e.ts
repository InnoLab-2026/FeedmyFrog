/**
 * Puts the end-to-end database into a known state.
 *
 * Truncate then insert, so a run does not depend on what the last one left
 * behind and a failed run cannot poison the next. It talks to Postgres
 * directly rather than through the app's driver: this runs before the app
 * exists, and it should not need the HTTP proxy to be up.
 *
 * Refuses to run against anything but a local database. Truncating the
 * listings table is the single most destructive thing in this repository, and
 * the guard is what keeps a stray DATABASE_URL from pointing it at Neon.
 */
import pg from 'pg';

import {
  E2E_EMAIL,
  E2E_USER_ID,
  SEEDED_LISTINGS,
} from '../cypress/fixtures/e2e-user';

const CONNECTION_STRING =
  process.env.POSTGRES_URL ??
  'postgres://postgres:postgres@127.0.0.1:5432/feedmyfrog_e2e';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

function assertLocal(connectionString: string): void {
  const { hostname } = new URL(connectionString);

  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `Refusing to seed: ${hostname} is not a local database. This script ` +
        `truncates every listing. Set POSTGRES_URL to a throwaway database.`,
    );
  }
}

async function main(): Promise<void> {
  assertLocal(CONNECTION_STRING);

  const client = new pg.Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  try {
    await client.query('TRUNCATE listings, magic_tokens, rate_limits');

    for (const listing of SEEDED_LISTINGS) {
      await client.query(
        `INSERT INTO listings (user_id, email, type, title, description, tags, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          E2E_USER_ID,
          E2E_EMAIL,
          listing.type,
          listing.title,
          listing.description,
          listing.tags,
          listing.location,
        ],
      );
    }

    const { rows } = await client.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM listings',
    );

    console.log(
      `seeded ${rows[0].count} listings owned by ${E2E_EMAIL} (${E2E_USER_ID.slice(0, 12)}…)`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
