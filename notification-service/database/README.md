# Database Setup Guide

This directory contains all SQL scripts needed to set up the Wellness Notification Service database.

## Prerequisites

- PostgreSQL 14 or higher installed
- `psql` command-line tool available
- Access to a PostgreSQL server with database creation privileges

## Quick Start

Execute the scripts in the following order:
```bash
# 1. Create the database (one-time setup)
psql -U postgres -c "CREATE DATABASE wellness_notifications;"

# 2. Execute all scripts in order
cd database
psql -U postgres -d wellness_notifications -f 01_schema.sql
psql -U postgres -d wellness_notifications -f 02_stored_procedures.sql
psql -U postgres -d wellness_notifications -f 03_seed.sql
psql -U postgres -d wellness_notifications -f 04_indexes.sql
```

## Script Descriptions

### 01_schema.sql
Creates all database tables:
- `wellness_tips` - Stores pre-generated wellness tips
- `user_notification_preferences` - User notification settings and device tokens
- `notification_logs` - Audit log of all notification attempts
- `notification_locks` - Distributed locking for job coordination

**Run this first.**

### 02_stored_procedures.sql
Creates all stored procedures for data operations:
- User preference management (get, upsert, register device)
- Wellness tip retrieval (random tip, tip by ID)
- Notification scheduling (get users due, log attempts, check sent today)
- Job coordination (acquire/release locks)

**Run this second.**

### 03_seed.sql
Inserts 160 wellness tips across 8 categories:
- Sleep (20 tips)
- Study (25 tips)
- Exercise (20 tips)
- Nutrition (20 tips)
- Mental Health (25 tips)
- Social (15 tips)
- Organization (15 tips)
- Mindfulness (20 tips)

**Run this third.** Script is idempotent - safe to run multiple times.

### 04_indexes.sql
Creates performance indexes:
- User preference lookups
- Notification log queries
- Daily duplicate checking
- Recent tip avoidance

**Run this last.**

## Verification

After running all scripts, verify the setup:
```bash
# Connect to database
psql -U postgres -d wellness_notifications

# Check tables exist
\dt

# Check stored procedures exist
\df

# Check indexes exist
\di

# Verify tip count
SELECT COUNT(*) FROM wellness_tips;  -- Should return 160

# Test a stored procedure
SELECT * FROM sp_acquire_notification_job_lock();
SELECT * FROM sp_release_notification_job_lock();

# Exit
\q
```

## Resetting the Database

To completely reset and start fresh:
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS wellness_notifications;"
psql -U postgres -c "CREATE DATABASE wellness_notifications;"

# Re-run all scripts
psql -U postgres -d wellness_notifications -f 01_schema.sql
psql -U postgres -d wellness_notifications -f 02_stored_procedures.sql
psql -U postgres -d wellness_notifications -f 03_seed.sql
psql -U postgres -d wellness_notifications -f 04_indexes.sql
```

## Connection String

For the .NET application, use this connection string format:
```
Host=localhost;Database=wellness_notifications;Username=postgres;Password=YOUR_PASSWORD
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

## Notes

- All scripts are idempotent (safe to run multiple times)
- Scripts use `CREATE OR REPLACE` and `IF NOT EXISTS` where appropriate
- Seed data only inserts if `wellness_tips` table is empty
- All timestamps are stored in UTC (TIMESTAMPTZ)
- Advisory locks are used for distributed job coordination (lock ID: 1001)