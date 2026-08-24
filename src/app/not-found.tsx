import { headers } from 'next/headers';
import NotFoundCard from './NotFoundCard';

// Reading headers() opts this page into dynamic rendering, so the HTML is
// generated per request and Next's inline bootstrap scripts carry the same
// CSP nonce that src/proxy.ts put on the response header. A statically
// prerendered 404 would embed scripts without the per-request nonce and be
// blocked by the CSP.
export default async function NotFound() {
  await headers();

  return <NotFoundCard />;
}
