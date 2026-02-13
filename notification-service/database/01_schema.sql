-- ============================================================================
-- File: 01_schema.sql
-- Description: Database schema for Wellness Notification Service
-- ============================================================================

-- Drop existing tables (in correct order to respect foreign keys)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS user_notification_preferences CASCADE;
DROP TABLE IF EXISTS wellness_tips CASCADE;
DROP TABLE IF EXISTS notification_locks CASCADE;

-- ============================================================================
-- Table: wellness_tips
-- Description: Stores the pre-generated wellness tips for students
-- ============================================================================
CREATE TABLE wellness_tips (
    id SERIAL PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE wellness_tips IS 'Pre-generated wellness tips for daily notifications';
COMMENT ON COLUMN wellness_tips.content IS 'The wellness tip text (max 500 characters)';
COMMENT ON COLUMN wellness_tips.category IS 'Category of tip (e.g., sleep, study, exercise, mental_health)';

-- ============================================================================
-- Table: user_notification_preferences
-- Description: Stores user preferences for notifications
-- ============================================================================
CREATE TABLE user_notification_preferences (
    user_id UUID PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    preferred_time_utc TIME NOT NULL DEFAULT '09:00:00',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    device_token VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_notification_preferences IS 'User notification preferences and device tokens';
COMMENT ON COLUMN user_notification_preferences.user_id IS 'UUID of the user (from authentication service)';
COMMENT ON COLUMN user_notification_preferences.is_enabled IS 'Whether notifications are enabled for this user';
COMMENT ON COLUMN user_notification_preferences.preferred_time_utc IS 'Preferred time to receive notifications in UTC';
COMMENT ON COLUMN user_notification_preferences.timezone IS 'User timezone (IANA format, e.g., America/Toronto)';
COMMENT ON COLUMN user_notification_preferences.device_token IS 'Firebase Cloud Messaging device token';

-- ============================================================================
-- Table: notification_logs
-- Description: Logs all notification delivery attempts
-- ============================================================================
CREATE TABLE notification_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    tip_id INTEGER NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    device_token VARCHAR(500)
);

COMMENT ON TABLE notification_logs IS 'Audit log of all notification delivery attempts';
COMMENT ON COLUMN notification_logs.user_id IS 'UUID of the user who received (or failed to receive) the notification';
COMMENT ON COLUMN notification_logs.tip_id IS 'ID of the wellness tip that was sent';
COMMENT ON COLUMN notification_logs.status IS 'Delivery status: sent, failed, or pending';
COMMENT ON COLUMN notification_logs.error_message IS 'Error details if status is failed';
COMMENT ON COLUMN notification_logs.device_token IS 'Device token used for this attempt';

-- ============================================================================
-- Table: notification_locks
-- Description: Distributed locking for background job coordination
-- ============================================================================
CREATE TABLE notification_locks (
    lock_key VARCHAR(100) PRIMARY KEY,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE notification_locks IS 'Distributed locks for preventing duplicate job execution';
COMMENT ON COLUMN notification_locks.lock_key IS 'Unique identifier for the lock';
COMMENT ON COLUMN notification_locks.locked_at IS 'When the lock was acquired';
COMMENT ON COLUMN notification_locks.expires_at IS 'When the lock expires (for cleanup)';

-- ============================================================================
-- Initial setup complete
-- ============================================================================