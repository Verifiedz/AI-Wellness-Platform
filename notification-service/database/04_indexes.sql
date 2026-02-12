-- ============================================================================
-- File: 04_indexes.sql
-- Description: Performance indexes for Wellness Notification Service
-- ============================================================================

-- ============================================================================
-- INDEXES FOR: user_notification_preferences
-- ============================================================================

-- Index on user_id (primary key already creates this automatically)
-- This comment is just for documentation

-- Index for scheduler queries: finding users by preferred time
CREATE INDEX IF NOT EXISTS idx_user_prefs_preferred_time 
ON user_notification_preferences(preferred_time_utc)
WHERE is_enabled = true AND device_token IS NOT NULL;

COMMENT ON INDEX idx_user_prefs_preferred_time IS 'Optimizes scheduler queries for users due for notifications';

-- Index for enabled users with device tokens
CREATE INDEX IF NOT EXISTS idx_user_prefs_enabled 
ON user_notification_preferences(is_enabled, device_token)
WHERE is_enabled = true;

COMMENT ON INDEX idx_user_prefs_enabled IS 'Quickly find enabled users with registered devices';

-- ============================================================================
-- INDEXES FOR: notification_logs
-- ============================================================================

-- Index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id 
ON notification_logs(user_id);

COMMENT ON INDEX idx_notification_logs_user_id IS 'Optimizes queries for user notification history';

-- Composite index for checking if notification was sent today
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent_at 
ON notification_logs(user_id, sent_at DESC)
WHERE status = 'sent';

COMMENT ON INDEX idx_notification_logs_user_sent_at IS 'Optimizes daily duplicate check queries';

-- Index on sent_at for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
ON notification_logs(sent_at DESC);

COMMENT ON INDEX idx_notification_logs_sent_at IS 'Optimizes time-based queries and log cleanup';

-- Index on tip_id for analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_tip_id 
ON notification_logs(tip_id);

COMMENT ON INDEX idx_notification_logs_tip_id IS 'Optimizes queries for tip usage statistics';

-- Composite index for recent user notifications (used in sp_get_random_wellness_tip)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_recent 
ON notification_logs(user_id, tip_id, sent_at DESC)
WHERE status = 'sent';

COMMENT ON INDEX idx_notification_logs_user_recent IS 'Optimizes queries for avoiding recently sent tips';

-- ============================================================================
-- INDEXES FOR: wellness_tips
-- ============================================================================

-- Index on category for category-based filtering (if needed in future)
CREATE INDEX IF NOT EXISTS idx_wellness_tips_category 
ON wellness_tips(category);

COMMENT ON INDEX idx_wellness_tips_category IS 'Optimizes category-based tip queries';

-- ============================================================================
-- INDEXES FOR: notification_locks
-- ============================================================================

-- Index on expires_at for cleanup of expired locks
CREATE INDEX IF NOT EXISTS idx_notification_locks_expires 
ON notification_locks(expires_at);

COMMENT ON INDEX idx_notification_locks_expires IS 'Optimizes cleanup of expired locks';

-- ============================================================================
-- Display all indexes created
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'Successfully created % custom indexes', index_count;
END $$;

-- ============================================================================
-- Index creation complete
-- ============================================================================