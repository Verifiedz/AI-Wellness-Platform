namespace JournalService.Api.Models.Responses;

/// <summary>
/// A single pattern insight detected from journal entry analysis.
/// </summary>
public class PatternInsight
{
    /// <summary>
    /// Category of the insight: "day_of_week", "energy_trend", "mood_streak", "emotion_frequency".
    /// </summary>
    public string InsightType { get; set; } = string.Empty;

    /// <summary>
    /// Short headline for the insight.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable description of the detected pattern.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Confidence score from 0.0 to 1.0.
    /// </summary>
    public decimal Confidence { get; set; }

    /// <summary>
    /// Number of journal entries that contributed to this insight.
    /// </summary>
    public int DataPoints { get; set; }
}

/// <summary>
/// Response envelope for pattern insights.
/// </summary>
public class PatternInsightsResponse
{
    public List<PatternInsight> Insights { get; set; } = [];
    public int TotalEntriesAnalyzed { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
}
