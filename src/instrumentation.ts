import { registerOTel } from '@vercel/otel';

/*
 * Server-side tracing.
 *
 * Next calls this once per server process, before any request is handled.
 * `registerOTel` wires up the OpenTelemetry SDK with the exporter Vercel's
 * runtime already provides, so on Vercel the spans show up under the
 * deployment's Observability tab with no exporter configuration and no
 * third-party account. Running anywhere else it is inert rather than broken:
 * with no collector configured the spans are simply dropped.
 *
 * What this buys over the built-in function timings is the shape *inside* a
 * request. Vercel reports how long the function took; the spans say how much
 * of that was each Postgres round trip, which is the number the query
 * batching in this codebase is trying to move. A function that takes 300ms
 * because it made eight serial database calls and one that takes 300ms
 * rendering look identical without this, and are fixed very differently.
 */
export function register() {
  registerOTel({ serviceName: 'feedmyfrog' });
}

/*
 * Server-side error reporting.
 *
 * Next calls this for every uncaught error in a server component, route
 * handler, or server action, with enough context to tell an RSC render apart
 * from a route handler. Without it those errors are a digest hash in the
 * client and a line in the runtime log that nothing groups or counts.
 */
export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; renderSource?: string },
) {
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'request_error',
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      renderSource: context.renderSource,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
}
