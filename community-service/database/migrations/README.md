# community-service migrations

Post-baseline schema changes go here. The baseline (`01_schema.sql`,
`02_moderation.sql` in the parent directory) runs via Postgres's
`docker-entrypoint-initdb.d` on first volume creation. Every schema change
after that lives in this folder and is applied by the `community-migrator`
docker-compose service.

Filename convention: `YYYYMMDDHHMM_<slug>.sql` (UTC). See
`docs/DATABASE_MIGRATIONS.md` for the rules and workflow.
