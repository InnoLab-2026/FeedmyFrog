import 'server-only';
import { lt, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { rateLimits } from '@/db/schema';

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

export async function checkAndConsume(
  key: string,
  max: number,
  windowMs: number,
): Promise<LimitResult> {
  const since = new Date(Date.now() - windowMs);

  /*
   * Counting and consuming in one statement, for two reasons.
   *
   * Latency: neon-http spends a full HTTPS round trip per query, so the
   * read-then-write pair cost two of them on every login attempt -- and this
   * helper is called twice per request, once per limit dimension.
   *
   * Correctness: the pair was also a check-then-act race. Two requests for
   * the same key could both read a count under the limit and both insert,
   * letting a caller past the ceiling. Here the INSERT's own SELECT re-reads
   * the tally inside the same statement, so the decision and the write cannot
   * be separated by another transaction's commit.
   *
   * `inserted` is what actually happened, not what we predicted: a row is
   * added only when the WHERE holds, and the caller is told it was consumed
   * only if it was.
   */
  const result = await db.execute<{ used: number; inserted: number }>(sql`
    WITH used AS (
      SELECT count(*)::int AS n
        FROM ${rateLimits}
       WHERE ${rateLimits.key} = ${key}
         AND ${rateLimits.createdAt} >= ${since}
    ),
    consumed AS (
      INSERT INTO ${rateLimits} (${sql.identifier('key')})
      SELECT ${key} FROM used WHERE used.n < ${max}
      RETURNING 1
    )
    SELECT used.n AS used,
           (SELECT count(*)::int FROM consumed) AS inserted
      FROM used
  `);

  const row = result.rows[0];
  const used = Number(row?.used ?? 0);
  const inserted = Number(row?.inserted ?? 0);

  if (!inserted) {
    return { ok: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  return { ok: true, remaining: Math.max(0, max - used - 1) };
}

/**
 * The housekeeping delete, as a query *builder* rather than an awaited call.
 *
 * Returning it unexecuted lets the caller put it in a `db.batch` alongside
 * its own writes, so old rows are swept in a round trip the request was
 * already paying for instead of one of its own. Awaiting the return value
 * still runs it on its own, which is what the tests do.
 */
export function cleanupRateLimits() {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return db.delete(rateLimits).where(lt(rateLimits.createdAt, cutoff));
}
