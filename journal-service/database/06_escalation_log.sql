-- ============================================================================
-- Escalation Audit Log
-- Records when escalation suggestions are shown to users.
-- Contains NO PII — only user_id, type, source, and timestamp.
-- ============================================================================

CREATE TABLE IF NOT EXISTS escalation_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('CRISIS', 'PROFESSIONAL', 'PEER')),
    source      VARCHAR(30) NOT NULL CHECK (source IN ('ai_chat', 'assessment', 'manual')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_user
    ON escalation_events (user_id, created_at DESC);

-- Stored procedure to log an escalation event
CREATE OR REPLACE FUNCTION sp_log_escalation(
    p_user_id UUID,
    p_type VARCHAR(20),
    p_source VARCHAR(30)
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO escalation_events (user_id, type, source)
    VALUES (p_user_id, p_type, p_source)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
