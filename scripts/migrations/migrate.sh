#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Sakina — DbUp-style SQL migration runner (Issue 16).
#
# Applies every .sql file in a directory to a Postgres database, tracks what
# has been applied, and refuses to run anything twice. Modelled on DbUp's
# journal-table pattern but implemented in shell so we don't need to add
# another .NET runtime per service.
#
# Why this exists:
#   Postgres's docker-entrypoint-initdb.d only runs on an empty data volume.
#   That's fine for the first launch, but every subsequent schema change
#   would require operators to manually `psql -f` a new file in the right
#   order. With this script every service's `database/migrations/` folder is
#   the ordered, append-only source of truth and deploys become safe.
#
# Usage (inside a container with psql installed):
#   migrate.sh <PGHOST> <PGPORT> <PGDATABASE> <PGUSER> <MIGRATIONS_DIR>
#
# Password is read from $PGPASSWORD to avoid leaking into `ps` output.
# -----------------------------------------------------------------------------

set -euo pipefail

if [[ $# -ne 5 ]]; then
    echo "Usage: $0 <host> <port> <database> <user> <migrations_dir>" >&2
    exit 2
fi

PGHOST="$1"
PGPORT="$2"
PGDATABASE="$3"
PGUSER="$4"
MIGRATIONS_DIR="$5"

export PGHOST PGPORT PGDATABASE PGUSER
# PGPASSWORD is expected to be inherited from the caller.

log() { echo "[migrate][$PGDATABASE] $*"; }

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
    log "migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Wait for Postgres to accept connections. The container orchestrator already
# uses a health check, but we double-check here because we also run on the
# host during local development where no health-check wrapper exists.
log "waiting for Postgres to accept connections..."
for attempt in $(seq 1 30); do
    if psql -v ON_ERROR_STOP=1 -c 'SELECT 1;' >/dev/null 2>&1; then
        break
    fi
    if [[ $attempt -eq 30 ]]; then
        log "Postgres still unreachable after 30 attempts; bailing"
        exit 3
    fi
    sleep 1
done

# Journal table. Tracks filename + checksum + applied_at so operators can
# audit drift (e.g. somebody edits an already-applied migration in place).
log "ensuring schema_migrations table exists..."
psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    TEXT        PRIMARY KEY,
    checksum    TEXT        NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by  TEXT        NOT NULL DEFAULT CURRENT_USER
);
SQL

# Run each .sql file in numeric/alphabetic order. Files are expected to be
# prefixed with a monotonic number (01_, 02_, ...) so sort stays deterministic.
applied_count=0
skipped_count=0
for file in $(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort); do
    filename=$(basename "$file")
    # sha256sum works on both Alpine (coreutils) and Debian-based images.
    checksum=$(sha256sum "$file" | awk '{print $1}')

    already=$(psql -v ON_ERROR_STOP=1 -tA -c \
        "SELECT checksum FROM schema_migrations WHERE filename = '$filename';")

    if [[ -n "$already" ]]; then
        if [[ "$already" != "$checksum" ]]; then
            # In-place edits are the #1 way teams break production DBs. We
            # fail loudly rather than silently skipping so the drift has to
            # be acknowledged by adding a new migration instead.
            log "ERROR: $filename has already been applied but its checksum changed."
            log "       Expected: $already"
            log "       Found:    $checksum"
            log "       Add a new migration file — do not edit applied ones."
            exit 4
        fi
        skipped_count=$((skipped_count + 1))
        continue
    fi

    log "applying $filename..."
    # Each migration runs in its own transaction so a failing file leaves
    # the DB in the last known-good state.
    psql -v ON_ERROR_STOP=1 --single-transaction -f "$file"
    psql -v ON_ERROR_STOP=1 -c \
        "INSERT INTO schema_migrations (filename, checksum) VALUES ('$filename', '$checksum');"
    applied_count=$((applied_count + 1))
done

log "done. applied=$applied_count skipped=$skipped_count"
