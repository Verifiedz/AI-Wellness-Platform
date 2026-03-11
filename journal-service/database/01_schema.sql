-- ============================================================================
-- Journal Service Database Schema
-- ============================================================================

-- Mood enum type (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_type') THEN
        CREATE TYPE mood_type AS ENUM ('great', 'good', 'okay', 'low', 'tough');
    END IF;
END$$;

-- Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    mood            VARCHAR(10) NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'low', 'tough')),
    emotions        TEXT[] DEFAULT '{}',
    energy_level    INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
    content         TEXT NOT NULL,
    entry_date      DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_entry_date UNIQUE (user_id, entry_date)
);

-- Journal prompts table (optional prompts to inspire journaling)
CREATE TABLE IF NOT EXISTS journal_prompts (
    id              SERIAL PRIMARY KEY,
    content         TEXT NOT NULL,
    category        VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
