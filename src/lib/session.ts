import 'server-only';
import { SignJWT, jwtVerify, type JWTVerifyOptions } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { env } from '@/lib/env';

const SECRET = new TextEncoder().encode(env.AUTH_SECRET);

/*
 * `__Host-` in production, and nothing else is accepted there.
 *
 * The prefix's whole guarantee is that only the exact host can set the
 * cookie -- a subdomain cannot. Reading an unprefixed `session` as a fallback
 * gave that guarantee away again: anything able to write a cookie for the
 * parent domain (an XSS on any *.feedmyfrog.click, a sibling app) could plant
 * a validly-signed session of its own and fix a reader into someone else's
 * account. Development has no TLS, so it uses the plain name -- and there,
 * that IS the only name.
 */
export const SESSION_COOKIE = env.NODE_ENV === 'production'
  ? '__Host-session'
  : 'session';

/** Pinned so the header can never choose the verification algorithm. */
const JWT_OPTIONS: JWTVerifyOptions = { clockTolerance: 30, algorithms: ['HS256'] };

const Payload = z.object({
  userId: z.string().regex(/^[a-f0-9]{64}$/),
  email: z.string().email(),
});
export type Session = z.infer<typeof Payload>;

export async function createSession(s: Session): Promise<void> {
  const days = env.SESSION_TTL_DAYS;
  const jwt = await new SignJWT(s)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(SECRET);

  (await cookies()).set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: days * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const jwt = jar.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, SECRET, JWT_OPTIONS);
    const result = Payload.safeParse(payload);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// Data-access-layer guard: every server component or helper that reads
// user-scoped or member-only data calls this instead of trusting that the
// proxy or a parent layout already ran. Proxy, layout, and page checks
// together form the defense-in-depth recommended for App Router auth.
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete('session');
}
