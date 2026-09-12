export const runtime = 'nodejs';

// The edge runtime was deprecated in Next.js 16.3 and warns on every build.
// Moving to nodejs costs this route nothing: it reads no request, touches no
// database, and answers from constants.
//
// force-dynamic is what keeps it a liveness probe. The edge runtime opted the
// route out of static generation implicitly; without a runtime that does so,
// a handler with no request input and no I/O is prerenderable, and a probe
// answered from a prerendered asset reports "ok" whether or not the function
// is serving. Rendering per request is the whole signal.
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    { status: 'ok' },
    { headers: { 'cache-control': 'no-store' } },
  );
}
