# Performance notes

Why the app is shaped the way it is in the places where the shape was chosen
for latency rather than for readability. Numbers here were measured, not
estimated; the method for reproducing each is given so they can be re-checked
when the data grows.

## The thing that dominates: round trips, not query time

The app talks to Postgres through `@neondatabase/serverless`'s HTTP driver
(`drizzle-orm/neon-http`). That driver opens a **fresh HTTPS request per
query**. There is no connection held open between statements, so the cost of a
page is much closer to *how many times it spoke to the database* than to how
long any statement took. Neon measures 25–40 ms for a single query from a
function in the same region; from a different continent it is far worse.

That makes two patterns expensive that look free in ordinary Postgres code:

- `await` on one query, then `await` on the next. Every `await db…` is a round
  trip, and a dependent second query cannot start until the first returns.
- Housekeeping deletes issued on their own.

Both are fixed the same way — `db.batch([...])`, which drizzle sends as one
Neon `transaction()`, i.e. **one HTTPS request**, with the statements executed
server-side in the order given. Ordering inside a batch is guaranteed, so it is
safe for writes that depend on each other; `src/app/api/auth/send-link/route.ts`
relies on that to invalidate old magic tokens strictly before inserting a new
one.

Measured, with a local stand-in that counts requests (see below):

| Path | Round trips before | After |
|---|---|---|
| Marketplace page (`/`) | 3, in 2 dependent waves | **1** |
| Magic-link request (`POST /api/auth/send-link`) | 8, fully serial | **2** |

The marketplace fetches its page of rows at the *requested* page number inside
the batch, because the clamp to `totalPages` is not known until the count comes
back. That guess is right for every in-range page; only an out-of-range
`?page=` costs a second query.

### Reproducing the round-trip count

Point `DATABASE_URL` at a local HTTP server that speaks Neon's wire format
(`{query, params}` in, or `{queries: […]}` for a batch; `{results: […]}` back,
with `rowAsArray: true` because drizzle asks for array mode) and log each
request. Set `neonConfig.fetchEndpoint` to it. Requests to the app then print
one line per round trip.

## Indexes

`drizzle/0002_*.sql`. Measured with `EXPLAIN (ANALYZE, BUFFERS)` on 50,000
generated listings in a local Postgres 16:

| Query | Before | After |
|---|---|---|
| Category filter (`tags @> ARRAY[…]`) | 7.6 ms — read 25,000 rows, discarded 18,750 | **2.5 ms** — index returns the 6,250 matches |
| Free-text search (`ILIKE '%q%'` over title + description) | 24.4 ms — read 25,000, kept 55 | **0.95 ms** |

- `idx_listings_tags` is GIN. A btree cannot answer array containment at all,
  so without it the planner used the type index and threw away three quarters
  of what it read.
- `idx_listings_title_trgm` / `idx_listings_desc_trgm` are GIN with
  `gin_trgm_ops`. A leading `%` wildcard makes a btree useless; trigram indexes
  index the substrings, which is what makes it indexable. **These require
  `pg_trgm`**, enabled at the top of the same migration. `drizzle-kit generate`
  does not emit extension statements — if that migration is ever regenerated,
  the `CREATE EXTENSION` line has to be put back by hand.

### Known remaining cost

The category-tab aggregation (`SELECT unnest(tags), count(*) … GROUP BY 1`) is
a parallel sequential scan of every listing of that mode, ~11 ms at 50,000
rows, and it runs on **every** marketplace render. No index helps a full
aggregation. It is inside the batch, so it costs no extra round trip, but it
grows linearly with the table. If the listing count gets large, cache it —
it depends only on `mode`, and it changes only when a listing is written.

## Region

`vercel.json` pins functions to **`fra1`** (Frankfurt).

Vercel's default is `iad1`, Washington DC. The database is Neon in Frankfurt
(see `.env.example`), so on the default every one of the round trips above
would cross the Atlantic — roughly 90–120 ms each, paid per query. Colocating
the function with the data is worth more than any query tuning in this
document. The readership is a German university, so the region is also closer
to the users.

## Observability

Two complementary things, both first-party, both inert off Vercel:

- `src/instrumentation.ts` — `registerOTel()` from `@vercel/otel`, plus an
  `onRequestError` hook. Vercel's built-in metrics give per-function duration;
  these spans say what that duration was *spent on*. A 300 ms response caused
  by eight serial database calls and one caused by rendering look identical in
  function timings and are fixed very differently. This is the instrument that
  makes the round-trip work above visible rather than theoretical.
- `<SpeedInsights />` in `src/app/layout.tsx` — real-user Core Web Vitals per
  route. It renders no markup and appends its own script, which is why it
  passes the `strict-dynamic` CSP in `src/proxy.ts`: a script tag in the HTML
  would need the per-request nonce and the package has no prop for one, but a
  script created by the already-trusted bundle inherits its trust. Its beacon
  is same-origin, so `connect-src 'self'` covers it.

Both are read in the Vercel dashboard under the deployment's Observability and
Speed Insights tabs. Neither needs an exporter or a third-party account.
