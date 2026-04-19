# chat-service migrations

Post-baseline schema changes go here. The baseline (the `Tables/` and
`StoreProcedures/` folders, run in order by `chatservice_db_build.sh`) runs
via Postgres's `docker-entrypoint-initdb.d` on first volume creation. Every
schema change after that lives in this folder and is applied by the
`chat-migrator` docker-compose service.

Filename convention: `YYYYMMDDHHMM_<slug>.sql` (UTC). See
`docs/DATABASE_MIGRATIONS.md` for the rules and workflow.
