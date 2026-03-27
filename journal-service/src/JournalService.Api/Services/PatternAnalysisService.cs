namespace JournalService.Api.Services;

using JournalService.Api.Models.Entities;
using JournalService.Api.Models.Responses;

/// <summary>
/// Analyzes journal entries to detect recurring patterns in mood, energy,
/// and emotions. All analysis is deterministic — patterns are only reported
/// when supported by actual data above confidence thresholds.
/// </summary>
public class PatternAnalysisService
{
    private const int MinEntriesForAnalysis = 7;
    private const int MinEntriesPerDay = 3;
    private const decimal MinConfidence = 0.6m;

    private static readonly string[] DayNames =
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    /// <summary>
    /// Runs all pattern detectors on the provided entries and returns
    /// insights that meet the confidence threshold.
    /// </summary>
    public PatternInsightsResponse Analyze(
        IReadOnlyList<JournalEntry> entries,
        DateOnly startDate,
        DateOnly endDate)
    {
        var insights = new List<PatternInsight>();

        if (entries.Count >= MinEntriesForAnalysis)
        {
            insights.AddRange(AnalyzeDayOfWeekPatterns(entries));
            insights.AddRange(AnalyzeEnergyTrends(entries));
            insights.AddRange(AnalyzeMoodStreaks(entries));
            insights.AddRange(AnalyzeEmotionFrequency(entries));
        }

        return new PatternInsightsResponse
        {
            Insights = insights.Where(i => i.Confidence >= MinConfidence).ToList(),
            TotalEntriesAnalyzed = entries.Count,
            StartDate = startDate.ToString("yyyy-MM-dd"),
            EndDate = endDate.ToString("yyyy-MM-dd")
        };
    }

    /// <summary>
    /// Detects moods that appear disproportionately on specific days of the week.
    /// e.g. "You tend to feel low on Mondays"
    /// </summary>
    private static List<PatternInsight> AnalyzeDayOfWeekPatterns(IReadOnlyList<JournalEntry> entries)
    {
        var insights = new List<PatternInsight>();

        // Group entries by day of week
        var byDay = entries.GroupBy(e => e.EntryDate.DayOfWeek)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Overall mood distribution
        var overallMoodRates = entries
            .GroupBy(e => e.Mood)
            .ToDictionary(g => g.Key, g => (decimal)g.Count() / entries.Count);

        foreach (var (day, dayEntries) in byDay)
        {
            if (dayEntries.Count < MinEntriesPerDay) continue;

            var dayMoodRates = dayEntries
                .GroupBy(e => e.Mood)
                .ToDictionary(g => g.Key, g => (decimal)g.Count() / dayEntries.Count);

            foreach (var (mood, dayRate) in dayMoodRates)
            {
                if (!overallMoodRates.TryGetValue(mood, out var overallRate) || overallRate == 0)
                    continue;

                var ratio = dayRate / overallRate;

                // Mood appears at least 1.8x more often on this day
                if (ratio >= 1.8m && dayRate >= 0.4m)
                {
                    var dayName = DayNames[(int)day];
                    var confidence = Math.Min(1.0m, 0.5m + (ratio - 1.0m) * 0.2m);

                    insights.Add(new PatternInsight
                    {
                        InsightType = "day_of_week",
                        Title = $"{mood.ToUpperInvariant()[0]}{mood[1..]} on {dayName}s",
                        Description = $"You tend to feel {mood} on {dayName}s " +
                                      $"({Math.Round(dayRate * 100)}% vs {Math.Round(overallRate * 100)}% overall).",
                        Confidence = Math.Round(confidence, 2),
                        DataPoints = dayEntries.Count
                    });
                }
            }
        }

        return insights;
    }

    /// <summary>
    /// Detects whether energy levels are trending up or down over time.
    /// Compares the first half of the date range to the second half.
    /// </summary>
    private static List<PatternInsight> AnalyzeEnergyTrends(IReadOnlyList<JournalEntry> entries)
    {
        var insights = new List<PatternInsight>();
        var sorted = entries.OrderBy(e => e.EntryDate).ToList();

        if (sorted.Count < 6) return insights;

        var midpoint = sorted.Count / 2;
        var firstHalf = sorted.Take(midpoint).ToList();
        var secondHalf = sorted.Skip(midpoint).ToList();

        var firstAvg = firstHalf.Average(e => (decimal)e.EnergyLevel);
        var secondAvg = secondHalf.Average(e => (decimal)e.EnergyLevel);
        var diff = secondAvg - firstAvg;
        var absDiff = Math.Abs(diff);

        // Require at least 0.8 point difference on a 1-10 scale
        if (absDiff >= 0.8m)
        {
            var direction = diff > 0 ? "up" : "down";
            var emoji = diff > 0 ? "improving" : "declining";
            var confidence = Math.Min(1.0m, 0.5m + absDiff * 0.15m);

            insights.Add(new PatternInsight
            {
                InsightType = "energy_trend",
                Title = $"Energy trending {direction}",
                Description = $"Your energy has been {emoji} recently " +
                              $"(avg {Math.Round(secondAvg, 1)} vs {Math.Round(firstAvg, 1)} earlier).",
                Confidence = Math.Round(confidence, 2),
                DataPoints = sorted.Count
            });
        }

        return insights;
    }

    /// <summary>
    /// Detects runs of 3+ consecutive days with the same mood.
    /// </summary>
    private static List<PatternInsight> AnalyzeMoodStreaks(IReadOnlyList<JournalEntry> entries)
    {
        var insights = new List<PatternInsight>();
        var sorted = entries.OrderBy(e => e.EntryDate).ToList();

        if (sorted.Count < 3) return insights;

        var currentMood = sorted[0].Mood;
        var streakStart = sorted[0].EntryDate;
        var streakLength = 1;
        var longestStreak = 1;
        var longestMood = currentMood;
        var longestEnd = streakStart;

        for (var i = 1; i < sorted.Count; i++)
        {
            if (sorted[i].Mood == currentMood &&
                sorted[i].EntryDate.DayNumber - sorted[i - 1].EntryDate.DayNumber <= 2)
            {
                streakLength++;
            }
            else
            {
                if (streakLength > longestStreak)
                {
                    longestStreak = streakLength;
                    longestMood = currentMood;
                    longestEnd = sorted[i - 1].EntryDate;
                }
                currentMood = sorted[i].Mood;
                streakStart = sorted[i].EntryDate;
                streakLength = 1;
            }
        }

        // Check final streak
        if (streakLength > longestStreak)
        {
            longestStreak = streakLength;
            longestMood = currentMood;
            longestEnd = sorted[^1].EntryDate;
        }

        if (longestStreak >= 3)
        {
            var confidence = Math.Min(1.0m, 0.5m + longestStreak * 0.1m);
            var qualifier = longestMood is "great" or "good" ? "positive" : "challenging";

            insights.Add(new PatternInsight
            {
                InsightType = "mood_streak",
                Title = $"{longestStreak}-day {longestMood} streak",
                Description = $"You had a {qualifier} streak of {longestStreak} days feeling {longestMood} " +
                              $"ending {longestEnd:MMM d}.",
                Confidence = Math.Round(confidence, 2),
                DataPoints = longestStreak
            });
        }

        return insights;
    }

    /// <summary>
    /// Finds emotions that appear in more than 40% of entries.
    /// </summary>
    private static List<PatternInsight> AnalyzeEmotionFrequency(IReadOnlyList<JournalEntry> entries)
    {
        var insights = new List<PatternInsight>();
        var emotionCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var entry in entries)
        {
            foreach (var emotion in entry.Emotions)
            {
                emotionCounts[emotion] = emotionCounts.GetValueOrDefault(emotion) + 1;
            }
        }

        foreach (var (emotion, count) in emotionCounts)
        {
            var frequency = (decimal)count / entries.Count;
            if (frequency >= 0.4m)
            {
                var confidence = Math.Min(1.0m, 0.5m + frequency * 0.5m);

                insights.Add(new PatternInsight
                {
                    InsightType = "emotion_frequency",
                    Title = $"Frequently {emotion.ToLower()}",
                    Description = $"You've tagged \"{emotion}\" in {Math.Round(frequency * 100)}% of your journal entries.",
                    Confidence = Math.Round(confidence, 2),
                    DataPoints = count
                });
            }
        }

        return insights;
    }
}
