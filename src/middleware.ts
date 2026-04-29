import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session';

export async function middleware(req: NextRequest) {
  const jwt = req.cookies.get(COOKIE)?.value ?? req.cookies.get('session')?.value;
  if (!jwt) return NextResponse.redirect(new URL('/login', req.url));
  try {
    await jwtVerify(jwt, SECRET, { clockTolerance: 30 });
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE);
    return res;
  }
}

export const config = {
  matcher: ['/', '/new', '/meine/:path*'],
};
