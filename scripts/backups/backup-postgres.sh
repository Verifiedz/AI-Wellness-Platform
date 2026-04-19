#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# backup-postgres.sh
# -----------------------------------------------------------------------------
# Takes a pg_dump of every Sakina Postgres database and writes compressed
# archives to $BACKUP_DIR. Designed to be run from a nightly cron job inside
# the Docker host (or an external scheduler with network access to the
# containers).
#
# Usage:
#   BACKUP_DIR=/var/backups/sakina \
#   AUTH_DB_PASSWORD=... \
#   JOURNAL_DB_PASSWORD=... \
#   NOTIFICATION_DB_PASSWORD=... \
#   COMMUNITY_DB_PASSWORD=... \
#   CHAT_DB_PASSWORD=... \
#   CHAT_DB_USER=postgres \
#   ./backup-postgres.sh
#
# Rotation: keeps $RETENTION_DAYS most recent per-database archives (default 7).
# -----------------------------------------------------------------------------
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sakina}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"

# database_name|container_name|username|password_env_var
DATABASES=(
  "authdb|auth_service_db|postgres|AUTH_DB_PASSWORD"
  "wellness_journal|journal_service_db|postgres|JOURNAL_DB_PASSWORD"
  "wellness_notifications|notification-db|postgres|NOTIFICATION_DB_PASSWORD"
  "wellness_community|community_service_db|postgres|COMMUNITY_DB_PASSWORD"
  "chatservicedb|chat_service_db|${CHAT_DB_USER:-postgres}|CHAT_DB_PASSWORD"
)

fail() {
  echo "[backup] ERROR: $1" >&2
  exit 1
}

for entry in "${DATABASES[@]}"; do
  IFS='|' read -r DB CONTAINER USER PASS_VAR <<<"$entry"
  PASSWORD="${!PASS_VAR-}"
  if [[ -z "$PASSWORD" ]]; then
    echo "[backup] WARN: $PASS_VAR not set, skipping $DB"
    continue
  fi

  OUT="$BACKUP_DIR/${DB}-${TIMESTAMP}.sql.gz"
  echo "[backup] Dumping $DB from $CONTAINER -> $OUT"

  # pg_dump is run INSIDE the container so we don't have to expose DB ports.
  if ! docker exec -e PGPASSWORD="$PASSWORD" "$CONTAINER" \
        pg_dump --no-owner --no-privileges --clean --if-exists -U "$USER" "$DB" \
      | gzip -9 >"$OUT.tmp"; then
    rm -f "$OUT.tmp"
    fail "pg_dump failed for $DB"
  fi

  mv "$OUT.tmp" "$OUT"

  # Reject empty dumps (gzip header is ~20 bytes; real dumps are >>1KiB).
  if [[ "$(stat -c%s "$OUT")" -lt 1024 ]]; then
    rm -f "$OUT"
    fail "Dump for $DB was suspiciously small (<1KiB); aborting"
  fi
done

# Prune old archives.
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete

echo "[backup] Done at $(date -u -Iseconds). Retention: ${RETENTION_DAYS}d."
