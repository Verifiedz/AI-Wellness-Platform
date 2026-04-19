namespace AIWellness.Auth.Models;

/// <summary>
/// Canonical list of auth-relevant events we persist to the
/// <c>security_audit_log</c> table. Keeping the strings in one place prevents
/// drift between emitters (e.g. "login_failed" vs "login_failure") which
/// would otherwise make incident-response queries miss rows.
/// </summary>
public static class SecurityAuditEventType
{
    public const string Register = "register";
    public const string LoginSuccess = "login_success";
    public const string LoginFailure = "login_failure";
    public const string LoginBlocked = "login_blocked";
    public const string TokenRefreshed = "token_refreshed";
    public const string Logout = "logout";
    public const string PasswordChanged = "password_changed";
    public const string PasswordResetRequested = "password_reset_requested";
    public const string PasswordResetCompleted = "password_reset_completed";
    public const string TwoFactorCodeSent = "two_factor_code_sent";
    public const string TwoFactorCodeVerified = "two_factor_code_verified";
    public const string TwoFactorCodeFailed = "two_factor_code_failed";
    public const string EmailVerificationSent = "email_verification_sent";
    public const string EmailVerified = "email_verified";
    public const string AccountLocked = "account_locked";
    public const string AccountDeleted = "account_deleted";
}

/// <summary>
/// Outcome enumeration for audit events. Stored as a small string in Postgres
/// (CHECK constraint in SecurityAuditLog.sql) rather than an enum so that we
/// can add new values without a schema migration.
/// </summary>
public static class SecurityAuditOutcome
{
    public const string Success = "success";
    public const string Failure = "failure";
    public const string Blocked = "blocked";
}

/// <summary>
/// Immutable representation of one audit event. Consumers populate
/// <see cref="Details"/> with free-form JSON-serializable metadata; the
/// writer serializes it to <c>jsonb</c> before persisting.
/// </summary>
public sealed record SecurityAuditEvent(
    string EventType,
    Guid? UserId,
    string? IpAddress,
    string? UserAgent,
    string? CorrelationId,
    string Outcome,
    object? Details
);
