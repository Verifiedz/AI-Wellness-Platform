namespace JournalService.Api.Services;

using JournalService.Api.Infrastructure;
using Npgsql;
using NpgsqlTypes;

/// <summary>
/// Checks assessment scores for severity-based escalation recommendations
/// and logs escalation events for audit purposes.
/// </summary>
public sealed class EscalationService
{
    private readonly AssessmentService _assessmentService;
    private readonly StoredProcedureExecutor _executor;
    private readonly ILogger<EscalationService> _logger;

    public EscalationService(
        AssessmentService assessmentService,
        StoredProcedureExecutor executor,
        ILogger<EscalationService> logger)
    {
        _assessmentService = assessmentService;
        _executor = executor;
        _logger = logger;
    }

    /// <summary>
    /// Check the user's latest assessment scores and return an escalation recommendation.
    /// PHQ-9 >= 20 or GAD-7 >= 15 -> professional
    /// PHQ-9 >= 10 or GAD-7 >= 10 -> peer
    /// Otherwise -> none
    /// </summary>
    public async Task<EscalationStatus> GetStatusAsync(Guid userId)
    {
        var phq9 = await _assessmentService.GetLatestAsync(userId, "PHQ9");
        var gad7 = await _assessmentService.GetLatestAsync(userId, "GAD7");

        var phq9Score = phq9?.TotalScore ?? 0;
        var gad7Score = gad7?.TotalScore ?? 0;

        if (phq9Score >= 20 || gad7Score >= 15)
        {
            return new EscalationStatus("PROFESSIONAL", "severe",
                "Based on your recent assessment scores, speaking with a professional could provide valuable support.");
        }

        if (phq9Score >= 10 || gad7Score >= 10)
        {
            return new EscalationStatus("PEER", "moderate",
                "You might find it helpful to connect with others who share similar experiences.");
        }

        return new EscalationStatus("NONE", "minimal", null);
    }

    /// <summary>
    /// Log an escalation event for audit (no PII stored).
    /// </summary>
    public async Task LogEventAsync(Guid userId, string type, string source)
    {
        _logger.LogInformation(
            "Logging escalation event: type={Type}, source={Source} for user {UserId}",
            type, source, userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_type", NpgsqlDbType.Varchar) { Value = type },
            new NpgsqlParameter("p_source", NpgsqlDbType.Varchar) { Value = source }
        };

        await _executor.ExecuteScalarAsync<Guid>("sp_log_escalation", parameters);
    }
}

public sealed record EscalationStatus(
    string RecommendedAction,
    string Severity,
    string? Message
);
