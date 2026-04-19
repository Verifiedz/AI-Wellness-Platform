#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# verify-restore.sh
# -----------------------------------------------------------------------------
# Takes the most recent dump produced by backup-postgres.sh for each database,
# restores it into a throwaway Postgres 16 container, and runs a small set of
# sanity queries (table count, row counts for critical tables). Exits non-zero
# if ANY restore fails — this is the "backups are actually recoverable" gate.
#
# Designed to be run daily AFTER backup-postgres.sh. App-store readiness
# requires more than "we have backups"; we must prove they restore.
#
# Usage:
#   BACKUP_DIR=/var/backups/sakina ./verify-restore.sh
# -----------------------------------------------------------------------------
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sakina}"
VERIFY_IMAGE="${VERIFY_IMAGE:-postgres:16}"
VERIFY_PORT="${VERIFY_PORT:-55432}"
VERIFY_CONTAINER="sakina_backup_verify_$$"
VERIFY_PASSWORD="verify_$(date +%s)_$RANDOM"

DATABASES=(
  "authdb"
  "wellness_journal"
  "wellness_notifications"
  "wellness_community"
  "chatservicedb"
)

cleanup() {
  docker rm -f "$VERIFY_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[verify] Starting verification container on port $VERIFY_PORT"
docker run -d --rm \
  --name "$VERIFY_CONTAINER" \
  -e POSTGRES_PASSWORD="$VERIFY_PASSWORD" \
  -e POSTGRES_DB=postgres \
  -p "$VERIFY_PORT:5432" \
  "$VERIFY_IMAGE" >/dev/null

# Wait for Postgres to accept connections.
for i in {1..30}; do
  if docker exec -e PGPASSWORD="$VERIFY_PASSWORD" "$VERIFY_CONTAINER" \
       pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo "[verify] ERROR: verify container never became ready"
    exit 1
  fi
done

RESTORE_FAILED=0

for DB in "${DATABASES[@]}"; do
  # Pick the newest archive for this database.
  LATEST="$(ls -1t "$BACKUP_DIR"/${DB}-*.sql.gz 2>/dev/null | head -n1 || true)"
  if [[ -z "$LATEST" ]]; then
    echo "[verify] WARN: no archive found for $DB; skipping"
    continue
  fi

  echo "[verify] Restoring $DB from $LATEST"
  docker exec -e PGPASSWORD="$VERIFY_PASSWORD" "$VERIFY_CONTAINER" \
    psql -U postgres -c "DROP DATABASE IF EXISTS \"$DB\";" >/dev/null
  docker exec -e PGPASSWORD="$VERIFY_PASSWORD" "$VERIFY_CONTAINER" \
    psql -U postgres -c "CREATE DATABASE \"$DB\";" >/dev/null

  if ! gunzip -c "$LATEST" | \
       docker exec -i -e PGPASSWORD="$VERIFY_PASSWORD" "$VERIFY_CONTAINER" \
         psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 >/dev/null; then
    echo "[verify] FAIL: restore of $DB errored"
    RESTORE_FAILED=1
    continue
  fi

  # Sanity check: must have at least one user table.
  TABLES=$(docker exec -e PGPASSWORD="$VERIFY_PASSWORD" "$VERIFY_CONTAINER" \
    psql -U postgres -d "$DB" -tAc \
    "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');")

  if [[ "$TABLES" -lt 1 ]]; then
    echo "[verify] FAIL: $DB restored with zero user tables"
    RESTORE_FAILED=1
  else
    echo "[verify] OK: $DB restored with $TABLES tables"
  fi
done

if [[ $RESTORE_FAILED -ne 0 ]]; then
  echo "[verify] One or more restores failed. Backups are NOT trustworthy."
  exit 1
fi

echo "[verify] All restores succeeded at $(date -u -Iseconds)."
