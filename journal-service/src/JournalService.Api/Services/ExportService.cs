namespace JournalService.Api.Services;

using System.Text;
using JournalService.Api.Models.Requests;
using JournalService.Api.Models.Responses;

/// <summary>
/// Aggregates wellness data and generates export files (CSV).
/// PDF generation requires QuestPDF and is deferred to a future phase;
/// CSV is fully self-contained with no external dependencies.
/// </summary>
public sealed class ExportService
{
    private readonly JournalEntryService _journalService;
    private readonly AssessmentService _assessmentService;
    private readonly ILogger<ExportService> _logger;

    public ExportService(
        JournalEntryService journalService,
        AssessmentService assessmentService,
        ILogger<ExportService> logger)
    {
        _journalService = journalService;
        _assessmentService = assessmentService;
        _logger = logger;
    }

    /// <summary>
    /// Aggregate export data for preview.
    /// </summary>
    public async Task<ExportDataResponse> BuildExportDataAsync(
        Guid userId, string userEmail, ExportRequest request)
    {
        _logger.LogInformation(
            "Building export data for user {UserId} from {Start} to {End}",
            userId, request.StartDate, request.EndDate);

        ExportMoodSummary? moodSummary = null;
        var assessments = new List<ExportAssessmentItem>();
        var journalSummaries = new List<ExportJournalSummaryItem>();

        // Mood data
        if (request.IncludeMoods || request.IncludeJournalSummaries)
        {
            var entries = await _journalService.GetEntriesAsync(
                userId, request.StartDate, request.EndDate, 500, 0);

            if (request.IncludeMoods && entries.Count > 0)
            {
                var moodCounts = entries
                    .GroupBy(e => e.Mood)
                    .ToDictionary(g => g.Key, g => g.Count());

                var mostCommon = moodCounts.OrderByDescending(kv => kv.Value).First().Key;
                var avgEnergy = (decimal)entries.Average(e => e.EnergyLevel);

                moodSummary = new ExportMoodSummary(
                    entries.Count, mostCommon, Math.Round(avgEnergy, 1), moodCounts);
            }

            if (request.IncludeJournalSummaries)
            {
                journalSummaries = entries.Select(e => new ExportJournalSummaryItem(
                    e.EntryDate,
                    e.Mood,
                    e.EnergyLevel,
                    string.IsNullOrWhiteSpace(e.Content)
                        ? 0
                        : e.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length
                )).ToList();
            }
        }

        // Assessment data
        if (request.IncludeAssessments)
        {
            var history = await _assessmentService.GetHistoryAsync(userId, limit: 100);
            assessments = history
                .Where(a => DateOnly.FromDateTime(a.CompletedAt) >= request.StartDate
                         && DateOnly.FromDateTime(a.CompletedAt) <= request.EndDate)
                .Select(a => new ExportAssessmentItem(
                    a.AssessmentType,
                    a.TotalScore,
                    a.AssessmentType == "PHQ9" ? 27 : 21,
                    a.SeverityLabel,
                    a.CompletedAt.ToString("yyyy-MM-dd HH:mm")))
                .ToList();
        }

        return new ExportDataResponse(
            userEmail,
            request.StartDate,
            request.EndDate,
            DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm UTC"),
            moodSummary,
            assessments,
            journalSummaries
        );
    }

    /// <summary>
    /// Generate a CSV byte array from export data.
    /// </summary>
    public byte[] GenerateCsv(ExportDataResponse data)
    {
        var sb = new StringBuilder();

        sb.AppendLine("Sakina Wellness Report");
        sb.AppendLine($"Generated: {data.GeneratedAt}");
        sb.AppendLine($"Period: {data.StartDate:yyyy-MM-dd} to {data.EndDate:yyyy-MM-dd}");
        sb.AppendLine($"User: {data.UserEmail}");
        sb.AppendLine();

        // Mood summary
        if (data.MoodSummary != null)
        {
            sb.AppendLine("=== MOOD SUMMARY ===");
            sb.AppendLine($"Total Entries,{data.MoodSummary.TotalEntries}");
            sb.AppendLine($"Most Common Mood,{data.MoodSummary.MostCommonMood}");
            sb.AppendLine($"Average Energy,{data.MoodSummary.AverageEnergy}");
            sb.AppendLine();
            sb.AppendLine("Mood,Count");
            foreach (var kv in data.MoodSummary.MoodCounts)
                sb.AppendLine($"{kv.Key},{kv.Value}");
            sb.AppendLine();
        }

        // Assessments
        if (data.Assessments.Count > 0)
        {
            sb.AppendLine("=== ASSESSMENTS ===");
            sb.AppendLine("Type,Score,MaxScore,Severity,CompletedAt");
            foreach (var a in data.Assessments)
                sb.AppendLine($"{a.Type},{a.Score},{a.MaxScore},{a.Severity},{a.CompletedAt}");
            sb.AppendLine();
        }

        // Journal summaries
        if (data.JournalSummaries.Count > 0)
        {
            sb.AppendLine("=== JOURNAL ENTRIES ===");
            sb.AppendLine("Date,Mood,EnergyLevel,WordCount");
            foreach (var j in data.JournalSummaries)
                sb.AppendLine($"{j.Date},{j.Mood},{j.EnergyLevel},{j.WordCount}");
        }

        sb.AppendLine();
        sb.AppendLine("DISCLAIMER: This is a screening tool summary and not a clinical diagnosis. Please discuss with a healthcare professional.");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
