/**
 * A Neon HTTP endpoint, backed by an ordinary PostgreSQL server.
 *
 * WHY THIS EXISTS
 *
 * The app talks to its database through `@neondatabase/serverless`, which does
 * not speak the PostgreSQL wire protocol at all: it POSTs SQL to an HTTPS
 * endpoint that Neon runs, and reads JSON back. That is what makes it work on
 * serverless runtimes, and it is also why you cannot simply point
 * `DATABASE_URL` at a local Postgres and expect the app to start.
 *
 * So the end-to-end suite has a choice: swap the driver for `node-postgres`
 * when running under test, or give the real driver something that answers like
 * Neon. Swapping the driver would mean the tests exercise a data layer the
 * production app never runs — and it would not even work here, because
 * `src/app/(auth)/page.tsx` uses `db.batch()`, which node-postgres does not
 * implement. This file takes the other road: the app under test is byte for
 * byte the app that deploys, including its driver, and only the far side of
 * the HTTP call is local.
 *
 * WHAT IT SPEAKS
 *
 * The protocol is small and is read off the driver itself
 * (`node_modules/@neondatabase/serverless/index.mjs`):
 *
 *   POST /sql
 *   Neon-Connection-String: <url>        (ignored here; one fixed database)
 *   Neon-Raw-Text-Output: true           (always sent -- see rawTextClient)
 *   Neon-Array-Mode: true                (always sent -- rows are arrays)
 *   Neon-Batch-Isolation-Level: <level>  (batch only)
 *   Neon-Batch-Read-Only: <bool>         (batch only)
 *   Neon-Batch-Deferrable: <bool>        (batch only)
 *
 *   body, one query:  {"query": "...", "params": [...]}
 *   body, a batch:    {"queries": [{"query": "...", "params": [...]}, ...]}
 *
 *   200 one query: the result object
 *   200 a batch:   {"results": [ <result>, ... ]}
 *   400 on a query error, as {"message", "code", "detail", ...}
 *
 * A result is `{fields: [{name, dataTypeID}], rows, rowCount, command,
 * rowAsArray}`, and every cell is the raw text Postgres sent. The driver
 * applies the `pg-types` parsers itself, keyed on `dataTypeID` -- so returning
 * a JavaScript `true` where Postgres would have said `t` gets parsed a second
 * time and silently becomes `false`. `rawTextClient()` below is what stops
 * that: it overrides the type parsers with the identity function, so values
 * reach the driver exactly as the server wrote them.
 *
 * SCOPE
 *
 * Test infrastructure. It has no authentication, ignores the connection string
 * it is handed, listens on localhost, and is started and stopped by the e2e
 * script. It must never run anywhere near production, and nothing in `src/`
 * imports it.
 */
import { createServer } from 'node:http';
import pg from 'pg';

const PORT = Number(process.env.NEON_PROXY_PORT ?? 5433);
const HOST = '127.0.0.1';

const CONNECTION_STRING =
  process.env.POSTGRES_URL ??
  'postgres://postgres:postgres@127.0.0.1:5432/feedmyfrog_e2e';

/*
 * Two properties this depends on, both enforced rather than assumed:
 *
 * It binds 127.0.0.1, not 0.0.0.0. It executes whatever SQL it is handed with
 * no authentication, which is only acceptable because nothing off this machine
 * can reach it. On a CI runner 0.0.0.0 would publish an unauthenticated SQL
 * console to the runner's network.
 *
 * It only ever talks to a local database. The Neon-Connection-String header
 * every request carries is deliberately ignored -- the backing database is
 * fixed at startup -- so a request cannot redirect this at another server. And
 * the address it is fixed to has to be on this machine, checked here because
 * `npm run e2e:db` can start it without going through scripts/e2e.sh.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

if (!LOCAL_HOSTS.has(new URL(CONNECTION_STRING).hostname)) {
  console.error(
    `Refusing to start: POSTGRES_URL points at ` +
      `${new URL(CONNECTION_STRING).hostname}, which is not this machine. ` +
      `This proxy runs SQL with no authentication and is for throwaway test ` +
      `databases only.`,
  );
  process.exit(1);
}

/**
 * A pool whose type parsers all return the string Postgres sent.
 *
 * `getTypeParser` is consulted per column OID; answering with the identity
 * function for every one of them is what "raw text output" means. It also
 * sidesteps having to know the OIDs of the enum types this schema creates,
 * which are assigned at migration time and differ per database.
 */
function rawTextClient() {
  return new pg.Pool({
    connectionString: CONNECTION_STRING,
    max: 10,
    types: { getTypeParser: () => (value) => value },
  });
}

const pool = rawTextClient();

/** Shapes a node-postgres result the way the Neon driver expects to read it. */
function toNeonResult(result) {
  return {
    command: result.command,
    rowCount: result.rowCount,
    rowAsArray: true,
    fields: (result.fields ?? []).map((f) => ({
      name: f.name,
      dataTypeID: f.dataTypeID,
      tableID: f.tableID,
      columnID: f.columnID,
      dataTypeSize: f.dataTypeSize,
      dataTypeModifier: f.dataTypeModifier,
      format: f.format,
    })),
    rows: result.rows ?? [],
  };
}

/** The 400 body the driver turns back into a thrown database error. */
function toNeonError(error) {
  return {
    message: error.message,
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    position: error.position,
    severity: error.severity,
    where: error.where,
    schema: error.schema,
    table: error.table,
    column: error.column,
    dataType: error.dataType,
    constraint: error.constraint,
  };
}

function runOne(client, { query, params }) {
  return client.query({ text: query, values: params ?? [], rowMode: 'array' });
}

/**
 * A batch is one transaction, which is what `db.batch()` promises callers:
 * the count and the page of rows in `page.tsx` are read at a single point in
 * time. The isolation level the driver asked for is honoured rather than
 * assumed, and anything that throws rolls the whole batch back.
 */
async function runBatch(queries, headers) {
  const client = await pool.connect();
  const isolation = headers['neon-batch-isolation-level'];
  const readOnly = headers['neon-batch-read-only'] === 'true';
  const deferrable = headers['neon-batch-deferrable'] === 'true';

  const begin = [
    'BEGIN',
    isolation ? `ISOLATION LEVEL ${isolation.replace(/[^A-Za-z ]/g, '')}` : '',
    readOnly ? 'READ ONLY' : '',
    deferrable ? 'DEFERRABLE' : '',
  ]
    .filter(Boolean)
    .join(' ');

  try {
    await client.query(begin);
    const results = [];
    for (const q of queries) {
      results.push(toNeonResult(await runOne(client, q)));
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

const server = createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: 'Only POST is supported' }));
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    const send = (status, payload) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    try {
      const parsed = JSON.parse(body);

      if (Array.isArray(parsed.queries)) {
        send(200, { results: await runBatch(parsed.queries, req.headers) });
      } else {
        send(200, toNeonResult(await runOne(pool, parsed)));
      }
    } catch (error) {
      // 400 is the status the driver reads as "the database said no", which is
      // what lets a failing query surface as a normal error in the app rather
      // than as a transport failure.
      send(400, toNeonError(error));
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`neon-http proxy listening on http://${HOST}:${PORT}/sql`);
  console.log(`  -> ${CONNECTION_STRING.replace(/:[^:@/]*@/, ':***@')}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close();
    pool.end().finally(() => process.exit(0));
  });
}
