-- ============================================================================
-- User Data Deletion (App Store Compliance — Apple Guideline 5.1.1(v))
-- Removes all notification data for a given user: delivery logs and preferences.
-- Called by auth-service via the internal gateway when a user deletes account.
-- ============================================================================

CREATE OR REPLACE FUNCTION sp_delete_user_data(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    v_total INTEGER := 0;
    v_count INTEGER;
BEGIN
    DELETE FROM notification_logs WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    DELETE FROM user_notification_preferences WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    RETURN v_total;
END;
$$;
