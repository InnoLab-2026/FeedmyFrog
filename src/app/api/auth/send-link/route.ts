import 'server-only';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, eq, lt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { magicTokens } from '@/db/schema';
import { generateToken } from '@/lib/auth';
import { sendMagicLink } from '@/lib/email';
import { checkAndConsume, cleanupRateLimits } from '@/lib/rate-limit';
import { Email } from '@/lib/validators';
import { env } from '@/lib/env';
import { LANGUAGES, type LangCode } from '@/i18n/translations';

const LANG_CODES = LANGUAGES.map((l) => l.code) as [LangCode, ...LangCode[]];
const Body = z.object({ email: Email, lang: z.enum(LANG_CODES).optional() });
const HOUR = 60 * 60 * 1000;

export async function POST(req: Request) {
  const ct = req.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('application/json')) {
    return NextResponse.json({ error: 'unsupported_media_type' }, { status: 415 });
  }

  let json: unknown;
  try { json = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    if (issue === 'forbidden_domain') {
      return NextResponse.json({ error: 'forbidden_domain' }, { status: 403 });
    }
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const email = parsed.data.email;
  const lang = parsed.data.lang ?? 'en';
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';

  /*
   * Both dimensions are always consumed -- the original code awaited each in
   * turn and only then decided -- so they can be asked concurrently. Over
   * neon-http that turns two serial round trips into one.
   */
  const [ipLimit, emailLimit] = await Promise.all([
    checkAndConsume(`send-link:ip:${ip}`, env.RATE_LIMIT_SEND_LINK_PER_IP, HOUR),
    checkAndConsume(`send-link:email:${email}`, env.RATE_LIMIT_SEND_LINK_PER_EMAIL, HOUR),
  ]);

  const blocked = !ipLimit.ok ? ipLimit : !emailLimit.ok ? emailLimit : null;
  if (blocked) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(blocked.retryAfterSeconds) } },
    );
  }

  const ttlMs = env.MAGIC_LINK_TTL_MINUTES * 60 * 1000;
  const { raw, hash } = generateToken();

  /*
   * Four writes, one round trip -- and one transaction.
   *
   * These ran as four separate awaits, which over neon-http is four separate
   * HTTPS requests. `db.batch` sends them as a single non-interactive
   * transaction, and the queries execute server-side in the order given, so
   * the invalidation below still happens strictly before the new token is
   * written. That ordering is load-bearing: the reverse would let the UPDATE
   * mark the token in the same statement group as already consumed, and the
   * link in the email would be dead on arrival.
   *
   * Batching also makes the pair atomic. Previously an error between the
   * UPDATE and the INSERT left the account with every token invalidated and
   * no new one -- a login that could not be completed or retried until the
   * user asked for another link.
   */
  await db.batch([
    // Any link already in someone's inbox stops working once a new one is asked for.
    db
      .update(magicTokens)
      .set({ consumed: true })
      .where(and(eq(magicTokens.email, email), eq(magicTokens.consumed, false))),

    db.insert(magicTokens).values({
      tokenHash: hash,
      email,
      expiresAt: new Date(Date.now() + ttlMs),
    }),

    // Housekeeping, riding along rather than paying for its own round trips.
    db.delete(magicTokens).where(lt(magicTokens.expiresAt, new Date(Date.now() - 7 * 24 * HOUR))),
    cleanupRateLimits(),
  ]);

  const url = `${env.NEXT_PUBLIC_BASE_URL}/verify-prompt?token=${encodeURIComponent(raw)}`;
  await sendMagicLink(email, url, lang);

  return NextResponse.json({ ok: true }, { status: 202 });
}
