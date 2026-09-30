import 'server-only';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import { env } from '@/lib/env';
import { resolveFetchEndpoint } from './httpEndpoint';
import * as schema from './schema';

/*
 * Where the driver POSTs its SQL.
 *
 * Read once, here, at module load — not per query, so nothing that happens
 * over HTTP can influence it afterwards. `resolveFetchEndpoint` decides
 * whether the environment is allowed to redirect it at all; see the rules in
 * httpEndpoint.ts. In every deployed environment the answer is `undefined`
 * and the driver keeps its own behaviour.
 */
const endpoint = resolveFetchEndpoint(process.env);

if (endpoint) {
  neonConfig.fetchEndpoint = endpoint;
}

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
