namespace JournalService.Api.Models.Responses;

public sealed record ExportDataResponse(
    string UserEmail,
    DateOnly StartDate,
    DateOnly EndDate,
    string GeneratedAt,
    ExportMoodSummary? MoodSummary,
    List<ExportAssessmentItem> Assessments,
    List<ExportJournalSummaryItem> JournalSummaries
);

public sealed record ExportMoodSummary(
    int TotalEntries,
    string MostCommonMood,
    decimal AverageEnergy,
    Dictionary<string, int> MoodCounts
);

public sealed record ExportAssessmentItem(
    string Type,
    int Score,
    int MaxScore,
    string Severity,
    string CompletedAt
);

public sealed record ExportJournalSummaryItem(
    string Date,
    string Mood,
    int EnergyLevel,
    int WordCount
);
