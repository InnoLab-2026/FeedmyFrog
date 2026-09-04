import 'server-only';
import { env } from '@/lib/env';

/**
 * Whether a state-changing request was made by this site.
 *
 * Server Actions get this check from Next.js for free — it compares Origin
 * against the forwarded host and aborts a mismatch. Route handlers get
 * nothing, so a handler that changes state and accepts a form content type is
 * reachable by a cross-site `<form>`: `application/x-www-form-urlencoded` is a
 * *simple* request, so there is no preflight for CORS to refuse.
 *
 * `Sec-Fetch-Site` is the primary signal because the browser sets it and no
 * page can forge it:
 *
 *   same-origin  this site  → allowed
 *   none         typed URL or bookmark, no initiator → allowed
 *   same-site    a *subdomain* → REFUSED. The session cookie is `__Host-`
 *                prefixed precisely so a subdomain cannot act for the apex,
 *                and it would be odd to close that door and leave this one.
 *   cross-site   → refused
 *
 * `Origin` is the fallback for browsers too old to send Sec-Fetch-Site, and is
 * compared against the configured base URL rather than the request's own Host
 * header — a Host an attacker controls would otherwise validate itself.
 *
 * A request carrying neither header is refused. Every browser this platform
 * targets sends at least one on a POST; a client that sends neither is not the
 * verify form.
 */
export function isSameOriginRequest(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin' || site === 'none';

  const origin = req.headers.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(env.NEXT_PUBLIC_BASE_URL).origin;
  } catch {
    return false;
  }
}
