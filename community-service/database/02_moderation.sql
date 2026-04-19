-- ============================================================================
-- Community Service — Moderation (Issue 3)
--
-- Adds the structures required by Apple App Store Guideline 1.2 and Google
-- Play's User-Generated Content policy:
--   * user-to-user blocking
--   * persistent report status with auto-hide threshold
--   * indexes that make moderation queries cheap
-- ============================================================================

-- One-directional block: blocker_id no longer sees anything authored by blocked_id.
CREATE TABLE IF NOT EXISTS community_blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID NOT NULL,
    blocked_id  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason      VARCHAR(200) NULL,
    UNIQUE (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_community_blocks_blocker ON community_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_community_blocks_blocked ON community_blocks (blocked_id);

-- Widen the existing reports.status domain so admins can mark reports as
-- "dismissed" without hiding content. Older databases may already have the
-- simpler CHECK; we rewrite it conditionally so the migration is idempotent.
DO $$
BEGIN
    ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
    ALTER TABLE reports
        ADD CONSTRAINT reports_status_check
        CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed'));
EXCEPTION WHEN undefined_table THEN
    -- reports table hasn't been created yet; schema 01 will set the constraint itself.
    NULL;
END $$;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by UUID NULL;

CREATE INDEX IF NOT EXISTS idx_reports_post        ON reports (post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter    ON reports (reporter_id);

-- Prevent the same user from reporting the same post twice. Kept permissive
-- (DO NOTHING on conflict) so repeat taps are silent.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_reporter_post
    ON reports (reporter_id, post_id);

-- ============================================================================
-- Auto-hide: once a post gathers >= 3 distinct pending reports, hide it and
-- flag it so moderators can find it quickly. The logic stays in the database
-- so it cannot be bypassed by a forgetful controller or by direct SQL tooling.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_auto_hide_reported_post()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT reporter_id) INTO v_count
    FROM reports
    WHERE post_id = NEW.post_id AND status = 'pending';

    IF v_count >= 3 THEN
        UPDATE posts
           SET is_flagged = TRUE,
               is_hidden  = TRUE
         WHERE id = NEW.post_id;
    ELSIF v_count >= 1 THEN
        UPDATE posts
           SET is_flagged = TRUE
         WHERE id = NEW.post_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_hide_reported_post ON reports;
CREATE TRIGGER trg_auto_hide_reported_post
    AFTER INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_hide_reported_post();
