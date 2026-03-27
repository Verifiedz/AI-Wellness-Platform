namespace JournalService.Api.Models.Responses;

public sealed record AssessmentResponse(
    Guid Id,
    string AssessmentType,
    int TotalScore,
    string Severity,
    string SeverityLabel,
    DateTime CompletedAt
);

public sealed record AssessmentDetailResponse(
    Guid Id,
    string AssessmentType,
    int TotalScore,
    int MaxScore,
    string Severity,
    string SeverityLabel,
    AssessmentResponseItemDto[] Responses,
    DateTime CompletedAt
);

public sealed record AssessmentResponseItemDto(
    int QuestionIndex,
    int Score
);

public sealed record AssessmentComparisonResponse(
    AssessmentResponse? First,
    AssessmentResponse? Latest,
    int? ScoreChange,
    string? TrendDirection
);
