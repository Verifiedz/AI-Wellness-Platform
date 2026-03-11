-- ============================================================================
-- Journal Service Stored Procedures (PostgreSQL Functions)
-- ============================================================================

-- Create a new journal entry
CREATE OR REPLACE FUNCTION sp_create_journal_entry(
    p_user_id       UUID,
    p_mood          VARCHAR(10),
    p_emotions      TEXT[],
    p_energy_level  INTEGER,
    p_content       TEXT,
    p_entry_date    DATE
)
RETURNS TABLE (
    id              UUID,
    user_id         UUID,
    mood            VARCHAR(10),
    emotions        TEXT[],
    energy_level    INTEGER,
    content         TEXT,
    entry_date      DATE,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO journal_entries (user_id, mood, emotions, energy_level, content, entry_date)
    VALUES (p_user_id, p_mood, p_emotions, p_energy_level, p_content, p_entry_date)
    RETURNING
        journal_entries.id,
        journal_entries.user_id,
        journal_entries.mood,
        journal_entries.emotions,
        journal_entries.energy_level,
        journal_entries.content,
        journal_entries.entry_date,
        journal_entries.created_at,
        journal_entries.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Get journal entries for a user with optional date range and pagination
CREATE OR REPLACE FUNCTION sp_get_journal_entries_by_user(
    p_user_id       UUID,
    p_start_date    DATE DEFAULT NULL,
    p_end_date      DATE DEFAULT NULL,
    p_limit         INTEGER DEFAULT 50,
    p_offset        INTEGER DEFAULT 0
)
RETURNS TABLE (
    id              UUID,
    user_id         UUID,
    mood            VARCHAR(10),
    emotions        TEXT[],
    energy_level    INTEGER,
    content         TEXT,
    entry_date      DATE,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        je.user_id,
        je.mood,
        je.emotions,
        je.energy_level,
        je.content,
        je.entry_date,
        je.created_at,
        je.updated_at
    FROM journal_entries je
    WHERE je.user_id = p_user_id
      AND (p_start_date IS NULL OR je.entry_date >= p_start_date)
      AND (p_end_date IS NULL OR je.entry_date <= p_end_date)
    ORDER BY je.entry_date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Get a single journal entry by ID (scoped to user for security)
CREATE OR REPLACE FUNCTION sp_get_journal_entry_by_id(
    p_entry_id  UUID,
    p_user_id   UUID
)
RETURNS TABLE (
    id              UUID,
    user_id         UUID,
    mood            VARCHAR(10),
    emotions        TEXT[],
    energy_level    INTEGER,
    content         TEXT,
    entry_date      DATE,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        je.user_id,
        je.mood,
        je.emotions,
        je.energy_level,
        je.content,
        je.entry_date,
        je.created_at,
        je.updated_at
    FROM journal_entries je
    WHERE je.id = p_entry_id
      AND je.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Get a journal entry for a specific user and date
CREATE OR REPLACE FUNCTION sp_get_journal_entry_by_date(
    p_user_id       UUID,
    p_entry_date    DATE
)
RETURNS TABLE (
    id              UUID,
    user_id         UUID,
    mood            VARCHAR(10),
    emotions        TEXT[],
    energy_level    INTEGER,
    content         TEXT,
    entry_date      DATE,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.id,
        je.user_id,
        je.mood,
        je.emotions,
        je.energy_level,
        je.content,
        je.entry_date,
        je.created_at,
        je.updated_at
    FROM journal_entries je
    WHERE je.user_id = p_user_id
      AND je.entry_date = p_entry_date;
END;
$$ LANGUAGE plpgsql;

-- Update an existing journal entry
CREATE OR REPLACE FUNCTION sp_update_journal_entry(
    p_entry_id      UUID,
    p_user_id       UUID,
    p_mood          VARCHAR(10),
    p_emotions      TEXT[],
    p_energy_level  INTEGER,
    p_content       TEXT
)
RETURNS TABLE (
    id              UUID,
    user_id         UUID,
    mood            VARCHAR(10),
    emotions        TEXT[],
    energy_level    INTEGER,
    content         TEXT,
    entry_date      DATE,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    UPDATE journal_entries je
    SET
        mood = p_mood,
        emotions = p_emotions,
        energy_level = p_energy_level,
        content = p_content,
        updated_at = NOW()
    WHERE je.id = p_entry_id
      AND je.user_id = p_user_id
    RETURNING
        je.id,
        je.user_id,
        je.mood,
        je.emotions,
        je.energy_level,
        je.content,
        je.entry_date,
        je.created_at,
        je.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Delete a journal entry (scoped to user)
CREATE OR REPLACE FUNCTION sp_delete_journal_entry(
    p_entry_id  UUID,
    p_user_id   UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    rows_deleted INTEGER;
BEGIN
    DELETE FROM journal_entries
    WHERE id = p_entry_id
      AND user_id = p_user_id;

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- Get mood summary statistics for a user within a date range
CREATE OR REPLACE FUNCTION sp_get_mood_summary(
    p_user_id       UUID,
    p_start_date    DATE,
    p_end_date      DATE
)
RETURNS TABLE (
    mood            VARCHAR(10),
    entry_count     BIGINT,
    avg_energy      NUMERIC(3,1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        je.mood,
        COUNT(*)::BIGINT AS entry_count,
        ROUND(AVG(je.energy_level), 1) AS avg_energy
    FROM journal_entries je
    WHERE je.user_id = p_user_id
      AND je.entry_date >= p_start_date
      AND je.entry_date <= p_end_date
    GROUP BY je.mood
    ORDER BY entry_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Get a random journal prompt (optionally filtered by category)
CREATE OR REPLACE FUNCTION sp_get_random_prompt(
    p_category VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id          INTEGER,
    content     TEXT,
    category    VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        jp.id,
        jp.content,
        jp.category
    FROM journal_prompts jp
    WHERE (p_category IS NULL OR jp.category = p_category)
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
