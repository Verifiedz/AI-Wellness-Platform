-- ============================================================================
-- File: 02_stored_procedures.sql
-- Description: All stored procedures for Wellness Notification Service
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER PREFERENCES MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure: sp_get_user_preferences
-- Description: Retrieve notification preferences for a specific user
-- Parameters: p_user_id - UUID of the user
-- Returns: Single row with user preferences or NULL if not found
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_user_preferences(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    is_enabled BOOLEAN,
    preferred_time_utc TIME,
    timezone VARCHAR(50),
    device_token VARCHAR(500),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unp.user_id,
        unp.is_enabled,
        unp.preferred_time_utc,
        unp.timezone,
        unp.device_token,
        unp.created_at,
        unp.updated_at
    FROM user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_get_user_preferences IS 'Get notification preferences for a user';

-- ----------------------------------------------------------------------------
-- Procedure: sp_upsert_user_preferences
-- Description: Create or update user notification preferences
-- Parameters: 
--   p_user_id - UUID of the user
--   p_is_enabled - Whether notifications are enabled
--   p_preferred_time_utc - Preferred notification time in UTC
--   p_timezone - User timezone (IANA format)
--   p_device_token - Firebase device token (optional)
-- Returns: The updated/created preferences
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_upsert_user_preferences(
    p_user_id UUID,
    p_is_enabled BOOLEAN,
    p_preferred_time_utc TIME,
    p_timezone VARCHAR(50),
    p_device_token VARCHAR(500) DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    is_enabled BOOLEAN,
    preferred_time_utc TIME,
    timezone VARCHAR(50),
    device_token VARCHAR(500),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Validate timezone is not empty
    IF p_timezone IS NULL OR TRIM(p_timezone) = '' THEN
        RAISE EXCEPTION 'Timezone cannot be empty';
    END IF;

    -- Insert or update preferences
    INSERT INTO user_notification_preferences (
        user_id, 
        is_enabled, 
        preferred_time_utc, 
        timezone, 
        device_token,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_is_enabled,
        p_preferred_time_utc,
        p_timezone,
        p_device_token,
        NOW(),
        NOW()
    )
    ON CONFLICT ON CONSTRAINT user_notification_preferences_pkey
    DO UPDATE SET
        is_enabled = EXCLUDED.is_enabled,
        preferred_time_utc = EXCLUDED.preferred_time_utc,
        timezone = EXCLUDED.timezone,
        device_token = COALESCE(EXCLUDED.device_token, user_notification_preferences.device_token),
        updated_at = NOW();

    -- Return the updated record (qualify to avoid ambiguity with RETURNS TABLE column names)
    RETURN QUERY
    SELECT 
        unp.user_id,
        unp.is_enabled,
        unp.preferred_time_utc,
        unp.timezone,
        unp.device_token,
        unp.created_at,
        unp.updated_at
    FROM user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_upsert_user_preferences IS 'Create or update user notification preferences';

-- ----------------------------------------------------------------------------
-- Procedure: sp_register_device_token
-- Description: Update device token for push notifications
-- Parameters:
--   p_user_id - UUID of the user
--   p_device_token - Firebase device token
-- Returns: Updated preferences
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_register_device_token(
    p_user_id UUID,
    p_device_token VARCHAR(500)
)
RETURNS TABLE (
    user_id UUID,
    is_enabled BOOLEAN,
    preferred_time_utc TIME,
    timezone VARCHAR(50),
    device_token VARCHAR(500),
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Validate device token
    IF p_device_token IS NULL OR TRIM(p_device_token) = '' THEN
        RAISE EXCEPTION 'Device token cannot be empty';
    END IF;

    -- Create preferences if they don't exist, otherwise update token
    INSERT INTO user_notification_preferences (
        user_id,
        device_token,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_device_token,
        NOW(),
        NOW()
    )
    ON CONFLICT ON CONSTRAINT user_notification_preferences_pkey
    DO UPDATE SET
        device_token = EXCLUDED.device_token,
        updated_at = NOW();

    -- Return updated record
    RETURN QUERY
    SELECT 
        unp.user_id,
        unp.is_enabled,
        unp.preferred_time_utc,
        unp.timezone,
        unp.device_token,
        unp.updated_at
    FROM user_notification_preferences unp
    WHERE unp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_register_device_token IS 'Register or update device token for push notifications';

-- ============================================================================
-- SECTION 2: WELLNESS TIPS MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure: sp_get_random_wellness_tip
-- Description: Get a random wellness tip that user hasn't received recently
-- Parameters: p_user_id - UUID of the user
-- Returns: Single wellness tip
-- Logic: Excludes tips sent to this user in the last 30 days
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_random_wellness_tip(p_user_id UUID)
RETURNS TABLE (
    id INTEGER,
    content VARCHAR(500),
    category VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.id,
        wt.content,
        wt.category
    FROM wellness_tips wt
    WHERE wt.id NOT IN (
        -- Exclude tips sent to this user in the last 30 days
        SELECT nl.tip_id
        FROM notification_logs nl
        WHERE nl.user_id = p_user_id
          AND nl.sent_at > NOW() - INTERVAL '30 days'
          AND nl.status = 'sent'
    )
    ORDER BY RANDOM()
    LIMIT 1;
    
    -- If no tips are available (all tips sent in last 30 days), return any random tip
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            wt.id,
            wt.content,
            wt.category
        FROM wellness_tips wt
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_get_random_wellness_tip IS 'Get random tip not recently sent to user';

-- ----------------------------------------------------------------------------
-- Procedure: sp_get_wellness_tip_by_id
-- Description: Retrieve a specific wellness tip by ID
-- Parameters: p_tip_id - ID of the tip
-- Returns: Single wellness tip or NULL if not found
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_wellness_tip_by_id(p_tip_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    content VARCHAR(500),
    category VARCHAR(50),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wt.id,
        wt.content,
        wt.category,
        wt.created_at
    FROM wellness_tips wt
    WHERE wt.id = p_tip_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_get_wellness_tip_by_id IS 'Get wellness tip by ID';

-- ============================================================================
-- SECTION 3: NOTIFICATION SCHEDULING & LOGGING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure: sp_get_users_due_for_notification
-- Description: Find users who should receive a notification now
-- Parameters: p_current_hour - Current hour in UTC (0-23)
-- Returns: List of users with their preferences and device tokens
-- Logic: 
--   1. Only enabled users
--   2. Only users with device tokens
--   3. Match preferred hour accounting for timezone offset
--   4. Exclude users who already received notification today
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_get_users_due_for_notification(p_current_hour INTEGER)
RETURNS TABLE (
    user_id UUID,
    device_token VARCHAR(500),
    timezone VARCHAR(50),
    preferred_time_utc TIME
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unp.user_id,
        unp.device_token,
        unp.timezone,
        unp.preferred_time_utc
    FROM user_notification_preferences unp
    WHERE unp.is_enabled = true
      AND unp.device_token IS NOT NULL
      AND unp.device_token != ''
      AND EXTRACT(HOUR FROM unp.preferred_time_utc) = p_current_hour
      -- Exclude users who already received a notification today
      AND NOT EXISTS (
          SELECT 1
          FROM notification_logs nl
          WHERE nl.user_id = unp.user_id
            AND nl.status = 'sent'
            AND nl.sent_at::DATE = CURRENT_DATE
      );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_get_users_due_for_notification IS 'Get users who should receive notification at current hour';

-- ----------------------------------------------------------------------------
-- Procedure: sp_log_notification_attempt
-- Description: Record a notification delivery attempt
-- Parameters:
--   p_user_id - UUID of the user
--   p_tip_id - ID of the wellness tip
--   p_status - Status: 'sent', 'failed', or 'pending'
--   p_error_message - Error details (if failed)
--   p_device_token - Device token used
-- Returns: ID of the created log entry
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_log_notification_attempt(
    p_user_id UUID,
    p_tip_id INTEGER,
    p_status VARCHAR(20),
    p_error_message TEXT DEFAULT NULL,
    p_device_token VARCHAR(500) DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_log_id BIGINT;
BEGIN
    -- Validate status
    IF p_status NOT IN ('sent', 'failed', 'pending') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be sent, failed, or pending', p_status;
    END IF;

    -- Insert log entry
    INSERT INTO notification_logs (
        user_id,
        tip_id,
        sent_at,
        status,
        error_message,
        device_token
    )
    VALUES (
        p_user_id,
        p_tip_id,
        NOW(),
        p_status,
        p_error_message,
        p_device_token
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_log_notification_attempt IS 'Log a notification delivery attempt';

-- ----------------------------------------------------------------------------
-- Procedure: sp_check_notification_sent_today
-- Description: Check if user already received a notification today
-- Parameters: p_user_id - UUID of the user
-- Returns: BOOLEAN (true if already sent today, false otherwise)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_check_notification_sent_today(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notification_logs
    WHERE user_id = p_user_id
      AND status = 'sent'
      AND sent_at::DATE = CURRENT_DATE;

    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_check_notification_sent_today IS 'Check if user received notification today';

-- ============================================================================
-- SECTION 4: JOB COORDINATION (PostgreSQL Advisory Locks)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Procedure: sp_acquire_notification_job_lock
-- Description: Acquire distributed lock for job execution
-- Parameters: None
-- Returns: BOOLEAN (true if lock acquired, false if already locked)
-- Implementation: Uses PostgreSQL advisory locks
-- Lock ID: 1001 (arbitrary unique number for this job)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_acquire_notification_job_lock()
RETURNS BOOLEAN AS $$
BEGIN
    -- Try to acquire advisory lock with ID 1001
    -- Returns TRUE if acquired, FALSE if already locked by another session
    RETURN pg_try_advisory_lock(1001);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_acquire_notification_job_lock IS 'Acquire distributed lock for notification job';

-- ----------------------------------------------------------------------------
-- Procedure: sp_release_notification_job_lock
-- Description: Release the distributed lock after job completes
-- Parameters: None
-- Returns: BOOLEAN (true if unlocked, false if not locked)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_release_notification_job_lock()
RETURNS BOOLEAN AS $$
BEGIN
    -- Release advisory lock with ID 1001
    -- Returns TRUE if unlocked, FALSE if lock was not held
    RETURN pg_advisory_unlock(1001);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_release_notification_job_lock IS 'Release distributed lock for notification job';

-- ============================================================================
-- Stored procedures creation complete
-- ============================================================================