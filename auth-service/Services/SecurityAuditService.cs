using System.Text.Json;
using AIWellness.Auth.Middleware;
using AIWellness.Auth.Models;
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services.Abstractions;
using Dapper;
using Npgsql;
using NpgsqlTypes;

namespace AIWellness.Auth.Services;

/// <summary>
/// Default Postgres-backed implementation of <see cref="ISecurityAuditService"/>.
///
/// Writes are parameterized and pinned to the <c>security_audit_log</c>
/// table. We swallow every exception (logging it at Error level) because a
/// failed audit write must never prevent the user from logging in or
/// registering — audit is a side effect, not a precondition. If writes are
/// failing for more than a few minutes, Sentry alerts will surface the
/// pattern to the on-call engineer.
/// </summary>
public sealed class SecurityAuditService : ISecurityAuditService
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<SecurityAuditService> _logger;

    public SecurityAuditService(
        IDbConnectionFactory dbFactory,
        IHttpContextAccessor httpContextAccessor,
        ILogger<SecurityAuditService> logger)
    {
        _dbFactory = dbFactory;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(SecurityAuditEvent auditEvent, CancellationToken cancellationToken = default)
    {
        try
        {
            // Use Npgsql directly so we can bind the Details parameter as
            // NpgsqlDbType.Jsonb — Dapper + dynamic parameter binding would
            // fall back to text and the CHECK/index behavior would degrade.
            using var connection = (NpgsqlConnection)_dbFactory.CreateConnection();

            const string sql = @"
                INSERT INTO security_audit_log
                    (event_type, user_id, ip_address, user_agent, correlation_id, outcome, details)
                VALUES
                    (@event_type, @user_id, @ip_address, @user_agent, @correlation_id, @outcome, @details::jsonb);
            ";

            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("event_type", auditEvent.EventType);
            command.Parameters.AddWithValue("user_id", (object?)auditEvent.UserId ?? DBNull.Value);
            command.Parameters.AddWithValue("ip_address", (object?)auditEvent.IpAddress ?? DBNull.Value);
            command.Parameters.AddWithValue("user_agent", (object?)auditEvent.UserAgent ?? DBNull.Value);
            command.Parameters.AddWithValue("correlation_id", (object?)auditEvent.CorrelationId ?? DBNull.Value);
            command.Parameters.AddWithValue("outcome", auditEvent.Outcome);

            var detailsJson = auditEvent.Details is null
                ? "{}"
                : JsonSerializer.Serialize(auditEvent.Details);
            var detailsParam = new NpgsqlParameter("details", NpgsqlDbType.Jsonb) { Value = detailsJson };
            command.Parameters.Add(detailsParam);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to persist security audit event {EventType} for user {UserId}",
                auditEvent.EventType, auditEvent.UserId);
        }
    }

    public Task LogAsync(
        string eventType,
        Guid? userId,
        string outcome = SecurityAuditOutcome.Success,
        object? details = null,
        CancellationToken cancellationToken = default)
    {
        var http = _httpContextAccessor.HttpContext;
        var ip = http?.Connection.RemoteIpAddress?.ToString();
        var userAgent = http?.Request.Headers.UserAgent.ToString();
        var correlationId = http?.Items[CorrelationIdMiddleware.HttpContextKey] as string;

        return LogAsync(new SecurityAuditEvent(
            eventType,
            userId,
            string.IsNullOrWhiteSpace(ip) ? null : ip,
            string.IsNullOrWhiteSpace(userAgent) ? null : userAgent,
            string.IsNullOrWhiteSpace(correlationId) ? null : correlationId,
            outcome,
            details), cancellationToken);
    }
}
