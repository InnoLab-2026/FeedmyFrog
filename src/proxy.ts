import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-session' : 'session';

// Routes that require a valid session (the (auth) route group).
const PROTECTED = [/^\/$/, /^\/new$/, /^\/meine(\/|$)/];

// Per-request nonce CSP. `'strict-dynamic'` lets Next.js's nonce-carrying
// bootstrap scripts load the scripts they inject; `'self'` remains as a
// fallback for browsers that predate strict-dynamic. Styles keep
// 'unsafe-inline' because the design system uses inline style attributes.
// Next's dev overlay and HMR need 'unsafe-eval', so it is added outside
// production only.
function buildCsp(nonce: string): string {
  const scriptSrc =
    process.env.NODE_ENV === 'production'
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function clearSessionCookies(res: NextResponse): void {
  // Use an explicit Set-Cookie with maxAge=0 instead of delete() so that
  // __Host- prefixed cookies (which require Secure + Path=/ on every
  // Set-Cookie header, including deletions) are correctly cleared by the
  // browser.
  const attrs = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  } as const;
  res.cookies.set(COOKIE, '', attrs);
  // Also clear the fallback unprefixed name used in development or by
  // older clients.
  if (COOKIE !== 'session') res.cookies.set('session', '', attrs);
}

export async function proxy(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  // The proxy is the first of three auth layers (proxy → layout → page/DAL).
  // It only pre-filters obviously unauthenticated requests; every page and
  // action re-validates the session close to the data.
  if (PROTECTED.some((re) => re.test(req.nextUrl.pathname))) {
    const jwt = req.cookies.get(COOKIE)?.value ?? req.cookies.get('session')?.value;
    if (!jwt) {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.headers.set('Content-Security-Policy', csp);
      return res;
    }
    try {
      await jwtVerify(jwt, SECRET, { clockTolerance: 30 });
    } catch {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.headers.set('Content-Security-Policy', csp);
      clearSessionCookies(res);
      return res;
    }
  }

  // Forward the CSP on the *request* so Next.js applies the nonce to its own
  // inline bootstrap scripts, and expose it as x-nonce for any component that
  // needs to tag a custom <script>.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  matcher: [
    // All HTML routes need the per-request nonce; static assets and API
    // routes are excluded, as are router prefetches (which never produce a
    // rendered document).
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|jpg|jpeg|webp|txt|xml)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
