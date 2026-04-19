# Sakina Postgres Backups

This directory contains the nightly backup + restore-verification pipeline that
Sakina requires before shipping to the App Store / Play Store. The rule: a
backup that has never been restored is not a backup.

## Files

| File                 | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `backup-postgres.sh` | Dumps every Sakina database to `$BACKUP_DIR` as gzipped `pg_dump` SQL.  |
| `verify-restore.sh`  | Spins up a throwaway Postgres container and restores the latest dumps. |
| `sakina-backup.cron` | Sample crontab entry wiring the two scripts together.                   |

## One-time setup

1. Choose a backup location on the Docker host with enough free space for
   `retention_days * total_db_size`. Recommended: `/var/backups/sakina` on a
   separate volume from the database data.
2. Copy the scripts to the host, `chmod +x` them, and make sure the user that
   runs cron can reach the Docker socket.
3. Create `/etc/sakina/backup.env` with the DB passwords. Example:

   ```env
   BACKUP_DIR=/var/backups/sakina
   RETENTION_DAYS=14
   AUTH_DB_PASSWORD=...
   JOURNAL_DB_PASSWORD=...
   NOTIFICATION_DB_PASSWORD=...
   COMMUNITY_DB_PASSWORD=...
   CHAT_DB_PASSWORD=...
   CHAT_DB_USER=postgres
   ```

   `chmod 600 /etc/sakina/backup.env` — these credentials are equivalent to
   root on the DB.

4. Install the cron job (see `sakina-backup.cron`).

## Daily flow

```
02:00 UTC  backup-postgres.sh   ->  /var/backups/sakina/<db>-<ts>.sql.gz
02:30 UTC  verify-restore.sh    ->  exits non-zero if any restore fails
```

If `verify-restore.sh` fails, the exit code should feed an alert (e.g. a
`systemd` `OnFailure=` unit that emails ops, or a Sentry cron-monitor ping).
Until that alert is wired up, **do not claim App Store readiness on this
item**.

## Off-host copy

The scripts above only produce local archives. For true disaster recovery the
archives must also be pushed off-host (S3 + versioning + lifecycle, Backblaze
B2, or equivalent) with at-rest encryption. A sample hook is available at the
end of `backup-postgres.sh`; add the sync step that matches your cloud.
