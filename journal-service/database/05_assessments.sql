-- ============================================================================
-- Assessment Tables for PHQ-9 and GAD-7 Wellbeing Metrics
-- ============================================================================

-- Assessment results table
CREATE TABLE IF NOT EXISTS assessments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL,
    assessment_type   VARCHAR(10) NOT NULL CHECK (assessment_type IN ('PHQ9', 'GAD7')),
    total_score       INTEGER NOT NULL CHECK (total_score >= 0),
    severity          VARCHAR(25) NOT NULL,
    responses         JSONB NOT NULL,
    completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_phq9_score CHECK (assessment_type != 'PHQ9' OR total_score <= 27),
    CONSTRAINT ck_gad7_score CHECK (assessment_type != 'GAD7' OR total_score <= 21)
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_type
    ON assessments (user_id, assessment_type, completed_at DESC);

-- ============================================================================
-- Stored procedures for assessment CRUD
-- ============================================================================

-- Submit a completed assessment
CREATE OR REPLACE FUNCTION sp_create_assessment(
    p_user_id UUID,
    p_assessment_type VARCHAR(10),
    p_total_score INTEGER,
    p_severity VARCHAR(25),
    p_responses JSONB
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    assessment_type VARCHAR(10),
    total_score INTEGER,
    severity VARCHAR(25),
    responses JSONB,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO assessments (user_id, assessment_type, total_score, severity, responses)
    VALUES (p_user_id, p_assessment_type, p_total_score, p_severity, p_responses)
    RETURNING assessments.id INTO v_id;

    RETURN QUERY
    SELECT a.id, a.user_id, a.assessment_type, a.total_score, a.severity, a.responses, a.completed_at
    FROM assessments a
    WHERE a.id = v_id;
END;
$$;

-- Get assessment history for a user
CREATE OR REPLACE FUNCTION sp_get_assessments(
    p_user_id UUID,
    p_assessment_type VARCHAR(10) DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    assessment_type VARCHAR(10),
    total_score INTEGER,
    severity VARCHAR(25),
    responses JSONB,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.user_id, a.assessment_type, a.total_score, a.severity, a.responses, a.completed_at
    FROM assessments a
    WHERE a.user_id = p_user_id
      AND (p_assessment_type IS NULL OR a.assessment_type = p_assessment_type)
    ORDER BY a.completed_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Get most recent assessment of a given type
CREATE OR REPLACE FUNCTION sp_get_latest_assessment(
    p_user_id UUID,
    p_assessment_type VARCHAR(10)
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    assessment_type VARCHAR(10),
    total_score INTEGER,
    severity VARCHAR(25),
    responses JSONB,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.user_id, a.assessment_type, a.total_score, a.severity, a.responses, a.completed_at
    FROM assessments a
    WHERE a.user_id = p_user_id
      AND a.assessment_type = p_assessment_type
    ORDER BY a.completed_at DESC
    LIMIT 1;
END;
$$;
