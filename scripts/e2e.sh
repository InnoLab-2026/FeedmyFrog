#!/usr/bin/env bash
#
# One end-to-end run, from an empty database to a Cypress report.
#
# The same script runs locally and in CI, so a failure on the runner can be
# reproduced with one command rather than by reading the workflow and doing it
# by hand. CI supplies POSTGRES_URL pointing at its service container; locally
# the default points at whatever `scripts/local-postgres.sh` started.
#
# The pieces, in order:
#
#   1. drizzle-kit migrate  -- the real migrations, not a schema dump, so a
#      broken migration fails here rather than in production
#   2. seed-e2e             -- one known user and two known listings
#   3. neon-http-proxy      -- lets the app's unmodified Neon driver reach the
#      local Postgres (see the comment at the top of that file)
#   4. next build && start  -- a production build, not the dev server: it is
#      the artefact that ships, and dev-only behaviour has hidden real bugs
#   5. cypress run
#
# Everything it starts, it stops -- including on failure.
set -euo pipefail

cd "$(dirname "$0")/.."

export POSTGRES_URL="${POSTGRES_URL:-postgres://postgres:postgres@127.0.0.1:5432/feedmyfrog_e2e}"
export NEON_PROXY_PORT="${NEON_PROXY_PORT:-5433}"
export APP_PORT="${APP_PORT:-3000}"

# What the app is handed. The host and port here are never dialled -- the Neon
# driver only parses this for the connection string it echoes back -- but it
# has to be a valid URL because lib/env.ts validates it as one.
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:${NEON_PROXY_PORT}/feedmyfrog_e2e"
export NEON_HTTP_ENDPOINT="http://127.0.0.1:${NEON_PROXY_PORT}/sql"

# Deterministic, throwaway, and identical on every run: a secret that changes
# between the app and the Cypress signer means every session silently fails to
# verify and every authenticated test redirects to /login.
export AUTH_SECRET="${AUTH_SECRET:-$(printf '0%.0s' {1..64})}"
export BREVO_API_KEY="xkeysib-e2e-not-a-real-key"
export NEXT_PUBLIC_BASE_URL="http://localhost:${APP_PORT}"
export NEXT_PUBLIC_INSTITUTION_DOMAIN="reutlingen-university.de"
export ALLOWED_EMAIL_DOMAIN="reutlingen-university.de"

# NODE_ENV is deliberately NOT overridden. `next build` bakes it into the edge
# middleware bundle as "production", while the Node-side session module reads
# it at runtime -- so forcing development here leaves the middleware looking
# for `__Host-session` and the page looking for `session`, and every
# authenticated request redirects to /login with nothing in the logs to say
# why. Running the production build as production keeps both on the hardened
# name, which is also the configuration that actually ships. Chrome treats
# localhost as a secure context, so a `Secure`, `__Host-`prefixed cookie is
# accepted over plain http there.

PROXY_PID=""
APP_PID=""

cleanup() {
  local status=$?
  [ -n "$APP_PID" ] && kill "$APP_PID" 2>/dev/null || true
  [ -n "$PROXY_PID" ] && kill "$PROXY_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT INT TERM

# Nothing else may already be listening.
#
# Without this the run looks fine and tests the wrong thing: `next start` dies
# with EADDRINUSE, and the health check below is then answered by whatever was
# already there -- a stale server from an earlier run, on an older build,
# against a different database.
require_free_port() {
  local name="$1" port="$2"
  if curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:${port}/" 2>/dev/null \
    || nc -z 127.0.0.1 "$port" 2>/dev/null; then
    echo "==> something is already listening on :${port} (${name})." >&2
    echo "    Stop it first; otherwise this run would test that, not this build." >&2
    return 1
  fi
}

wait_for() {
  local name="$1" url="$2" attempts="${3:-60}"
  for _ in $(seq 1 "$attempts"); do
    if curl -sf -o /dev/null "$url"; then
      echo "==> $name is up"
      return 0
    fi
    sleep 1
  done
  echo "==> $name never came up at $url" >&2
  return 1
}

# The database must be on this machine, checked before anything touches it.
#
# POSTGRES_URL is the one database setting a caller can override, and the very
# next command runs migrations against it. The seed script makes the same check
# because it truncates, but that is one step too late: a URL pointing at a real
# database would already have been migrated by then. Both checks exist because
# either script can be run on its own.
assert_local_database() {
  local host
  host="$(node -e 'process.stdout.write(new URL(process.argv[1]).hostname)' "$POSTGRES_URL")"

  case "$host" in
    localhost|127.0.0.1|::1|postgres) ;;
    *)
      echo "==> refusing to run against '${host}'." >&2
      echo "    This run migrates, truncates and rewrites every listing." >&2
      echo "    POSTGRES_URL must name a throwaway local database." >&2
      return 1
      ;;
  esac
}

assert_local_database
require_free_port "app" "$APP_PORT"
require_free_port "neon proxy" "$NEON_PROXY_PORT"

echo "==> applying migrations"
DATABASE_URL="$POSTGRES_URL" npx drizzle-kit migrate

echo "==> seeding"
npm run --silent db:seed

echo "==> starting the neon-http proxy on :${NEON_PROXY_PORT}"
node scripts/neon-http-proxy.mjs &
PROXY_PID=$!

# The proxy only answers POST, so a GET returning 405 is proof it is listening.
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${NEON_PROXY_PORT}/sql" || true)
  [ "$code" = "405" ] && break
  sleep 1
done
echo "==> proxy answering (HTTP $code to GET)"

echo "==> building"
npm run --silent build

echo "==> starting the app on :${APP_PORT}"
npx next start --port "$APP_PORT" &
APP_PID=$!
wait_for "app" "http://localhost:${APP_PORT}/api/healthz"

echo "==> running cypress"
npx cypress run --config "baseUrl=http://localhost:${APP_PORT}"
