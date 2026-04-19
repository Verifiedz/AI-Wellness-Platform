-- =============================================================================
-- Security Audit Log (Issue 9)
-- =============================================================================
-- Append-only record of every auth-relevant event. This is the primary
-- artifact the Apple/Google review teams (and our future SOC2 auditor) will
-- expect us to produce during incident response. The table is intentionally
-- separate from loginattempts so we can retain it longer than authentication
-- session history and so we can cover non-login events (registrations,
-- password changes, 2FA, account deletions, token refreshes).
--
-- Design rules:
--   * Append-only. There is no UPDATE or DELETE path in the application code.
--   * Every event carries an ip_address, user_agent, correlation_id and the
--     acting user_id (when known) — the four columns we need to reconstruct a
--     session after the fact.
--   * Actor user_id is nullable because some events (e.g. login attempts
--     against a non-existent email) have no user behind them.
--   * Foreign keys use ON DELETE SET NULL so that when a user deletes their
--     account (Issue 1), the audit trail is preserved but loses the linkage
--     — this is the intent for GDPR "right to erasure" vs security history.
-- =============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type       VARCHAR(64)  NOT NULL,
    user_id          UUID         REFERENCES users(id) ON DELETE SET NULL,
    ip_address       VARCHAR(45),
    user_agent       TEXT,
    correlation_id   VARCHAR(64),
    outcome          VARCHAR(16)  NOT NULL DEFAULT 'success'
        CHECK (outcome IN ('success', 'failure', 'blocked')),
    details          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    occurred_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes for the two most common queries during incident response:
--   1. "Show me everything for user X ordered by time."
--   2. "Show me every failed login from IP Y in the last 24h."
CREATE INDEX IF NOT EXISTS idx_sec_audit_user_time
    ON security_audit_log (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_sec_audit_ip_time
    ON security_audit_log (ip_address, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_sec_audit_event_time
    ON security_audit_log (event_type, occurred_at DESC);

-- Revoke UPDATE/DELETE from the application role to make the append-only
-- contract enforceable at the database layer. The application connects as the
-- `postgres` superuser by default, so this is a no-op in dev but documents
-- the expectation for any future least-privilege role.
--
-- Uncomment when a dedicated role is introduced:
-- REVOKE UPDATE, DELETE ON security_audit_log FROM sakina_app;
