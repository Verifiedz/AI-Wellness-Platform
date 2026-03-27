namespace JournalService.Api.Services;

using System.Text.Json;
using JournalService.Api.Infrastructure;
using JournalService.Api.Models.Entities;
using JournalService.Api.Models.Requests;
using JournalService.Api.Models.Responses;
using Npgsql;
using NpgsqlTypes;

public sealed class AssessmentService
{
    private readonly StoredProcedureExecutor _executor;
    private readonly ILogger<AssessmentService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public AssessmentService(
        StoredProcedureExecutor executor,
        ILogger<AssessmentService> logger)
    {
        _executor = executor;
        _logger = logger;
    }

    /// <summary>
    /// Score a completed assessment, persist it, and return the result.
    /// </summary>
    public async Task<AssessmentDetailResponse> SubmitAsync(Guid userId, SubmitAssessmentRequest request)
    {
        ValidateResponses(request);

        var totalScore = request.Responses.Sum(r => r.Score);
        var maxScore = request.AssessmentType == "PHQ9" ? 27 : 21;
        var severity = GetSeverity(request.AssessmentType, totalScore);
        var responsesJson = JsonSerializer.Serialize(request.Responses, JsonOpts);

        _logger.LogInformation(
            "Submitting {Type} assessment for user {UserId}: score {Score}/{Max} ({Severity})",
            request.AssessmentType, userId, totalScore, maxScore, severity);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_assessment_type", NpgsqlDbType.Varchar) { Value = request.AssessmentType },
            new NpgsqlParameter("p_total_score", NpgsqlDbType.Integer) { Value = totalScore },
            new NpgsqlParameter("p_severity", NpgsqlDbType.Varchar) { Value = severity },
            new NpgsqlParameter("p_responses", NpgsqlDbType.Jsonb) { Value = responsesJson }
        };

        var entity = await _executor.ExecuteSingleAsync("sp_create_assessment", parameters, MapAssessment);

        if (entity == null)
            throw new InvalidOperationException("Failed to create assessment record.");

        return ToDetailResponse(entity, maxScore);
    }

    /// <summary>
    /// Get assessment history for a user, optionally filtered by type.
    /// </summary>
    public async Task<List<AssessmentResponse>> GetHistoryAsync(
        Guid userId, string? assessmentType = null, int limit = 20, int offset = 0)
    {
        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_assessment_type", NpgsqlDbType.Varchar)
            {
                Value = (object?)assessmentType ?? DBNull.Value
            },
            new NpgsqlParameter("p_limit", NpgsqlDbType.Integer) { Value = limit },
            new NpgsqlParameter("p_offset", NpgsqlDbType.Integer) { Value = offset }
        };

        var entities = await _executor.ExecuteReaderAsync("sp_get_assessments", parameters, MapAssessment);
        return entities.Select(ToResponse).ToList();
    }

    /// <summary>
    /// Get the most recent assessment of a given type.
    /// </summary>
    public async Task<AssessmentDetailResponse?> GetLatestAsync(Guid userId, string assessmentType)
    {
        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_assessment_type", NpgsqlDbType.Varchar) { Value = assessmentType }
        };

        var entity = await _executor.ExecuteSingleAsync("sp_get_latest_assessment", parameters, MapAssessment);
        if (entity == null) return null;

        var maxScore = assessmentType == "PHQ9" ? 27 : 21;
        return ToDetailResponse(entity, maxScore);
    }

    /// <summary>
    /// Compare the first and latest assessments of a given type.
    /// </summary>
    public async Task<AssessmentComparisonResponse> GetComparisonAsync(Guid userId, string assessmentType)
    {
        var history = await GetHistoryAsync(userId, assessmentType, limit: 100);

        if (history.Count == 0)
            return new AssessmentComparisonResponse(null, null, null, null);

        var first = history[^1]; // oldest
        var latest = history[0]; // newest

        if (history.Count == 1)
            return new AssessmentComparisonResponse(first, first, 0, "stable");

        var change = latest.TotalScore - first.TotalScore;
        var trend = change < 0 ? "improving" : change > 0 ? "worsening" : "stable";

        return new AssessmentComparisonResponse(first, latest, change, trend);
    }

    // ===== Scoring Logic (exact published algorithms) =====

    /// <summary>
    /// Returns the severity classification based on the validated scoring bands.
    ///
    /// PHQ-9 (Depression): 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe
    /// GAD-7 (Anxiety):    0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-21 Severe
    /// </summary>
    public static string GetSeverity(string assessmentType, int score)
    {
        if (assessmentType == "PHQ9")
        {
            return score switch
            {
                <= 4 => "minimal",
                <= 9 => "mild",
                <= 14 => "moderate",
                <= 19 => "moderately_severe",
                _ => "severe"
            };
        }

        // GAD-7
        return score switch
        {
            <= 4 => "minimal",
            <= 9 => "mild",
            <= 14 => "moderate",
            _ => "severe"
        };
    }

    public static string GetSeverityLabel(string severity) => severity switch
    {
        "minimal" => "Minimal",
        "mild" => "Mild",
        "moderate" => "Moderate",
        "moderately_severe" => "Moderately Severe",
        "severe" => "Severe",
        _ => severity
    };

    // ===== Helpers =====

    private static void ValidateResponses(SubmitAssessmentRequest request)
    {
        var expectedCount = request.AssessmentType == "PHQ9" ? 9 : 7;

        if (request.Responses.Length != expectedCount)
            throw new ArgumentException(
                $"{request.AssessmentType} requires exactly {expectedCount} responses, got {request.Responses.Length}.");

        for (var i = 0; i < request.Responses.Length; i++)
        {
            if (request.Responses[i].Score < 0 || request.Responses[i].Score > 3)
                throw new ArgumentException(
                    $"Response at index {i} has invalid score {request.Responses[i].Score}. Must be 0-3.");
        }
    }

    private static Assessment MapAssessment(NpgsqlDataReader reader) => new()
    {
        Id = reader.GetGuidSafe("id"),
        UserId = reader.GetGuidSafe("user_id"),
        AssessmentType = reader.GetStringSafe("assessment_type"),
        TotalScore = reader.GetInt32Safe("total_score"),
        Severity = reader.GetStringSafe("severity"),
        Responses = reader.GetStringSafe("responses"),
        CompletedAt = reader.GetDateTimeSafe("completed_at")
    };

    private static AssessmentResponse ToResponse(Assessment a) => new(
        a.Id,
        a.AssessmentType,
        a.TotalScore,
        a.Severity,
        GetSeverityLabel(a.Severity),
        a.CompletedAt
    );

    private static AssessmentDetailResponse ToDetailResponse(Assessment a, int maxScore)
    {
        var items = JsonSerializer.Deserialize<AssessmentResponseItemDto[]>(a.Responses, JsonOpts)
            ?? [];

        return new AssessmentDetailResponse(
            a.Id,
            a.AssessmentType,
            a.TotalScore,
            maxScore,
            a.Severity,
            GetSeverityLabel(a.Severity),
            items,
            a.CompletedAt
        );
    }
}
