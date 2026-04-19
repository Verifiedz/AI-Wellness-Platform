using AIWellness.Auth.Models;

namespace AIWellness.Auth.Services.Abstractions;

/// <summary>
/// Writes auth-relevant events to the <c>security_audit_log</c> table.
///
/// This is NOT a general-purpose event bus; it exists specifically to satisfy
/// the "security audit log" requirement (Issue 9 / App Store readiness) and
/// the SOC2-style question "what happened with this account between time T1
/// and T2?". Every call is best-effort — failures are logged via ILogger and
/// Sentry but NEVER propagated to the caller, because losing an auth audit
/// record must not block a legitimate login or registration.
/// </summary>
public interface ISecurityAuditService
{
    Task LogAsync(SecurityAuditEvent auditEvent, CancellationToken cancellationToken = default);

    /// <summary>
    /// Convenience wrapper: fills in IP / user-agent / correlation-id from the
    /// current <see cref="HttpContext"/> so call sites only have to provide
    /// the event type, user id, and any extra details.
    /// </summary>
    Task LogAsync(
        string eventType,
        Guid? userId,
        string outcome = SecurityAuditOutcome.Success,
        object? details = null,
        CancellationToken cancellationToken = default);
}
