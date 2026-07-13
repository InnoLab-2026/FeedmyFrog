import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session';

export async function proxy(req: NextRequest) {
  const jwt = req.cookies.get(COOKIE)?.value ?? req.cookies.get('session')?.value;
  if (!jwt) return NextResponse.redirect(new URL('/login', req.url));
  try {
    await jwtVerify(jwt, SECRET, { clockTolerance: 30 });
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    // Use an explicit Set-Cookie with maxAge=0 instead of delete() so that
    // __Host- prefixed cookies (which require Secure + Path=/ on every
    // Set-Cookie header, including deletions) are correctly cleared by the
    // browser.
    res.cookies.set(COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    // Also clear the fallback unprefixed name used in development or by
    // older clients.
    if (COOKIE !== 'session') {
      res.cookies.set('session', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }
    return res;
  }
}

export const config = {
  matcher: ['/', '/new', '/meine/:path*'],
};
