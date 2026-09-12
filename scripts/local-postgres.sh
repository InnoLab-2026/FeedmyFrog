#!/usr/bin/env bash
#
# Starts a throwaway PostgreSQL for a local end-to-end run.
#
# CI does not use this -- there the database is a service container, which is
# the right tool on a runner. This exists so the same `scripts/e2e.sh` can be
# run on a laptop without Docker, against the postgresql server that is already
# installed on most developer machines.
#
# The cluster lives under .e2e-postgres/ (gitignored) and is disposable: `stop`
# removes it entirely. Nothing here is configured for durability or security,
# because nothing in it is worth either.
set -euo pipefail

cd "$(dirname "$0")/.."

PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}"
PGDATA="$(pwd)/.e2e-postgres/data"
PGSOCK="$(pwd)/.e2e-postgres/sock"
PGPORT="${PGPORT:-5432}"
DB_NAME="feedmyfrog_e2e"

if [ ! -x "${PGBIN}/initdb" ]; then
  echo "No PostgreSQL server found. Install postgresql, or set PGBIN." >&2
  exit 1
fi

# Postgres refuses to run as root, on the grounds that a compromised server
# should not own the machine. In a root container -- a devcontainer, most CI
# images -- that means dropping to the `postgres` account the package created.
# `pg()` is how every server command below is invoked, so there is one place
# that decides who runs it.
RUN_AS=""
if [ "$(id -u)" -eq 0 ]; then
  if ! id -u postgres >/dev/null 2>&1; then
    echo "Running as root and there is no 'postgres' user to drop to." >&2
    exit 1
  fi
  RUN_AS="postgres"
fi

pg() {
  if [ -n "$RUN_AS" ]; then
    su "$RUN_AS" -c "$*"
  else
    sh -c "$*"
  fi
}

start() {
  mkdir -p "$PGSOCK" "$(dirname "$PGDATA")"
  touch "$(pwd)/.e2e-postgres/postgres.log"

  if [ -n "$RUN_AS" ]; then
    chown -R "$RUN_AS" "$(pwd)/.e2e-postgres"
  fi

  if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "==> initialising a cluster in $PGDATA"
    mkdir -p "$PGDATA"
    [ -n "$RUN_AS" ] && chown "$RUN_AS" "$PGDATA"
    pg "${PGBIN}/initdb -D '$PGDATA' -U postgres --auth=trust" >/dev/null
  fi

  echo "==> starting postgres on :$PGPORT"
  pg "${PGBIN}/pg_ctl -D '$PGDATA' -l '$(pwd)/.e2e-postgres/postgres.log' \
    -o '-p ${PGPORT} -k ${PGSOCK} -c listen_addresses=127.0.0.1' -w start"

  # Recreated per run so a previous run's rows can never explain a pass.
  "${PGBIN}/psql" -h 127.0.0.1 -p "$PGPORT" -U postgres -d postgres \
    -c "DROP DATABASE IF EXISTS ${DB_NAME}" >/dev/null
  "${PGBIN}/psql" -h 127.0.0.1 -p "$PGPORT" -U postgres -d postgres \
    -c "CREATE DATABASE ${DB_NAME}" >/dev/null

  echo "==> postgres://postgres@127.0.0.1:${PGPORT}/${DB_NAME} ready"
}

stop() {
  if [ -d "$PGDATA" ]; then
    pg "${PGBIN}/pg_ctl -D '$PGDATA' -m immediate stop" >/dev/null 2>&1 || true
  fi
  rm -rf "$(pwd)/.e2e-postgres"
  echo "==> stopped and removed the cluster"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *) echo "usage: $0 [start|stop]" >&2; exit 1 ;;
esac
