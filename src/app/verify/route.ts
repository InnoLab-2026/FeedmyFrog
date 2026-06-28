import 'server-only';
import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { hashToken, userIdFromEmail } from '@/lib/auth';
import { createSession } from '@/lib/session';

export const runtime = 'nodejs';

// Redirect legacy GET links (e.g. from old emails) to the confirmation page so
// the token is not consumed by link-scanning bots that perform GET requests.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', req.url));
  }
  return NextResponse.redirect(
    new URL(`/verify-prompt?token=${encodeURIComponent(token)}`, req.url),
  );
}

// Token consumption only happens on POST (triggered by the "Log me in" button
// on /verify-prompt). Link scanners issue GET requests and never reach here.
export async function POST(req: Request) {
  let token: string | null = null;

  const ct = req.headers.get('content-type') ?? '';
  if (ct.toLowerCase().includes('application/x-www-form-urlencoded')) {
    const body = await req.text();
    token = new URLSearchParams(body).get('token');
  } else if (ct.toLowerCase().includes('application/json')) {
    let json: Record<string, unknown>;
    try {
      json = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.redirect(new URL('/login?error=missing_token', req.url), 303);
    }
    token = typeof json.token === 'string' ? json.token : null;
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', req.url), 303);
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
    return NextResponse.redirect(new URL('/login?error=invalid_or_expired', req.url), 303);
  }

  await createSession({ userId: userIdFromEmail(row.email), email: row.email });
  // 303 See Other: correct status for the Post/Redirect/Get pattern after a
  // form submission, ensuring the browser follows the redirect with a GET.
  return NextResponse.redirect(new URL('/', req.url), 303);
}
