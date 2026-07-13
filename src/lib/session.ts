import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { env } from '@/lib/env';

const SECRET = new TextEncoder().encode(env.AUTH_SECRET);

export const SESSION_COOKIE = env.NODE_ENV === 'production'
  ? '__Host-session'
  : 'session';

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
  const jwt = jar.get(SESSION_COOKIE)?.value ?? jar.get('session')?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, SECRET, { clockTolerance: 30 });
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
