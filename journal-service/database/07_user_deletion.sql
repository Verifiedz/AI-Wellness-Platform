-- ============================================================================
-- User Data Deletion (App Store Compliance — Apple Guideline 5.1.1(v))
-- Removes all journal-owned data for a given user: entries, assessments,
-- and escalation events. Called by auth-service via the internal gateway
-- when a user deletes their account.
-- ============================================================================

CREATE OR REPLACE FUNCTION sp_delete_user_data(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
    v_total INTEGER := 0;
    v_count INTEGER;
BEGIN
    DELETE FROM journal_entries WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    DELETE FROM assessments WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    DELETE FROM escalation_events WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    RETURN v_total;
END;
$$;
