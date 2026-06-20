import 'server-only';
import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { hashToken, userIdFromEmail } from '@/lib/auth';
import { createSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', req.url));
  }

  // Single-use + not-expired check, done atomically: only an unconsumed, still
  // valid token flips to consumed and yields its email. A second click (or a
  // race) matches zero rows and falls through to the error redirect.
  const [row] = await db
    .update(magicTokens)
    .set({ consumed: true })
    .where(
      and(
        eq(magicTokens.tokenHash, hashToken(token)),
        eq(magicTokens.consumed, false),
        gt(magicTokens.expiresAt, new Date()),
      ),
    )
    .returning({ email: magicTokens.email });

  if (!row) {
    return NextResponse.redirect(new URL('/login?error=invalid_or_expired', req.url));
  }

  await createSession({ userId: userIdFromEmail(row.email), email: row.email });
  return NextResponse.redirect(new URL('/', req.url));
}
