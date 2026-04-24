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

const Body = z.object({ email: Email });
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
  const ip = ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';

  const ipLimit = await checkAndConsume(`send-link:ip:${ip}`, env.RATE_LIMIT_SEND_LINK_PER_IP, HOUR);
  const emailLimit = await checkAndConsume(`send-link:email:${email}`, env.RATE_LIMIT_SEND_LINK_PER_EMAIL, HOUR);

  const blocked = !ipLimit.ok ? ipLimit : !emailLimit.ok ? emailLimit : null;
  if (blocked) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(blocked.retryAfterSeconds) } },
    );
  }

  await db
    .update(magicTokens)
    .set({ consumed: true })
    .where(and(eq(magicTokens.email, email), eq(magicTokens.consumed, false)));

  await db.delete(magicTokens).where(lt(magicTokens.expiresAt, new Date(Date.now() - 7 * 24 * HOUR)));
  await cleanupRateLimits();

  const ttlMs = env.MAGIC_LINK_TTL_MINUTES * 60 * 1000;
  const { raw, hash } = generateToken();
  await db.insert(magicTokens).values({
    tokenHash: hash,
    email,
    expiresAt: new Date(Date.now() + ttlMs),
  });

  const url = `${env.NEXT_PUBLIC_BASE_URL}/verify?token=${encodeURIComponent(raw)}`;
  await sendMagicLink(email, url);

  return NextResponse.json({ ok: true }, { status: 202 });
}
