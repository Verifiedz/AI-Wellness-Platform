-- ============================================================================
-- Journal Service Indexes
-- ============================================================================

-- Primary lookup: entries by user ordered by date
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date
    ON journal_entries (user_id, entry_date DESC);

-- Date range queries for mood summary
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date_range
    ON journal_entries (user_id, entry_date)
    INCLUDE (mood, energy_level);

-- Mood filtering
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood
    ON journal_entries (mood);

-- Prompt category lookup
CREATE INDEX IF NOT EXISTS idx_journal_prompts_category
    ON journal_prompts (category);
