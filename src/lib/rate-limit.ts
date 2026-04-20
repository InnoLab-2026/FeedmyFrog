import 'server-only';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
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
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rateLimits)
    .where(and(eq(rateLimits.key, key), gte(rateLimits.createdAt, since)));

  if (count >= max) {
    return { ok: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  await db.insert(rateLimits).values({ key });
  return { ok: true, remaining: Math.max(0, max - count - 1) };
}

export async function cleanupRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  await db.delete(rateLimits).where(lt(rateLimits.createdAt, cutoff));
}
