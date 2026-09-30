/**
 * Decides whether a request to redirect the database driver may be honoured.
 *
 * `@neondatabase/serverless` sends every query to an HTTP endpoint. That
 * endpoint is normally derived from the host in DATABASE_URL, and the
 * end-to-end suite needs to override it so the app can talk to a local
 * Postgres through scripts/neon-http-proxy.mjs.
 *
 * An override of where a database driver sends its queries is, stated plainly,
 * the ability to read and alter every row the application touches: whoever
 * controls the endpoint sees every query and writes every answer. So this is
 * not "a setting with a default". It is a capability, and the rules below are
 * chosen so that it cannot exist anywhere it is not needed:
 *
 *   1. **Absent is normal.** No variable, no override — production never sets
 *      it, so the default path is the real one and nothing has to be right for
 *      that to hold.
 *   2. **Never on Vercel.** The deployed app runs on Vercel, which sets the
 *      VERCEL variable on every runtime it operates. When that is present this
 *      refuses outright, whatever the value says. There is no argument on the
 *      merits of the endpoint at that point, because there is no legitimate
 *      reason for a deployment to be redirecting its own database traffic.
 *   3. **Loopback only.** Everywhere else, the endpoint must be on this
 *      machine. Even someone who could set the variable in an environment this
 *      does not refuse cannot aim it at a host they control, so it is not a
 *      route for data to leave the box.
 *   4. **Refuse loudly.** A rejected override throws at module load and the
 *      process does not start. Ignoring it silently would leave an operator
 *      believing traffic goes one way while it goes another, which is the
 *      failure this is meant to prevent.
 */

/** Hosts that are unambiguously this machine. */
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export class UnsafeEndpointError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeEndpointError';
  }
}

/**
 * Returns the endpoint to use, or `undefined` to leave the driver alone.
 *
 * `env` is passed in rather than read, so the rules are testable without
 * mutating the process.
 */
export function resolveFetchEndpoint(
  env: Record<string, string | undefined>,
): string | undefined {
  const raw = env.NEON_HTTP_ENDPOINT;

  if (!raw) return undefined;

  if (env.VERCEL) {
    throw new UnsafeEndpointError(
      'NEON_HTTP_ENDPOINT is set on a Vercel deployment. That variable exists ' +
        'only to point the end-to-end suite at a local database, and honouring ' +
        'it here would send every query somewhere other than the real one. ' +
        'Refusing to start; remove it from the environment.',
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeEndpointError(
      `NEON_HTTP_ENDPOINT is not a URL: ${JSON.stringify(raw)}`,
    );
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeEndpointError(
      `NEON_HTTP_ENDPOINT must be http or https, got ${url.protocol}`,
    );
  }

  if (url.username || url.password) {
    throw new UnsafeEndpointError(
      'NEON_HTTP_ENDPOINT must not carry credentials.',
    );
  }

  if (!LOOPBACK.has(url.hostname)) {
    throw new UnsafeEndpointError(
      `NEON_HTTP_ENDPOINT must point at this machine, got host ` +
        `${JSON.stringify(url.hostname)}. It can only ever be used to reach a ` +
        `local test database, never a remote one.`,
    );
  }

  return url.toString();
}
