namespace JournalService.Tests.Services;

using FluentAssertions;
using JournalService.Api.Models.Entities;
using JournalService.Api.Services;

public class PatternAnalysisServiceTests
{
    private readonly PatternAnalysisService _sut = new();

    private static DateOnly D(int year, int month, int day) => new(year, month, day);

    // ------------------------------------------------------------------ //
    // Analyze — empty / insufficient input
    // ------------------------------------------------------------------ //

    [Fact]
    public void Analyze_WithEmptyEntries_ReturnsResponseWithNoInsightsAndZeroCount()
    {
        // Arrange
        var entries = Array.Empty<JournalEntry>();
        var start = D(2025, 1, 1);
        var end = D(2025, 1, 31);

        // Act
        var result = _sut.Analyze(entries, start, end);

        // Assert
        result.Should().NotBeNull();
        result.Insights.Should().BeEmpty();
        result.TotalEntriesAnalyzed.Should().Be(0);
        result.StartDate.Should().Be("2025-01-01");
        result.EndDate.Should().Be("2025-01-31");
    }

    [Fact]
    public void Analyze_WithFewerThanMinimumEntries_ReturnsEmptyInsights()
    {
        // Arrange — 6 entries, minimum for analysis is 7
        var entries = Enumerable.Range(1, 6)
            .Select(i => new JournalEntry
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Mood = "good",
                Emotions = ["Happy"],
                EnergyLevel = 7,
                Content = $"Day {i}",
                EntryDate = D(2025, 1, i)
            })
            .ToList();

        var start = D(2025, 1, 1);
        var end = D(2025, 1, 6);

        // Act
        var result = _sut.Analyze(entries, start, end);

        // Assert
        result.Insights.Should().BeEmpty();
        result.TotalEntriesAnalyzed.Should().Be(6);
    }

    // ------------------------------------------------------------------ //
    // Analyze — returns insights when given sufficient data
    // ------------------------------------------------------------------ //

    [Fact]
    public void Analyze_WithEnoughEntries_ReturnsTotalEntriesAnalyzedCount()
    {
        // Arrange — 10 entries with varying moods and energies
        var entries = BuildDiverseEntries(10);
        var start = entries.Min(e => e.EntryDate);
        var end = entries.Max(e => e.EntryDate);

        // Act
        var result = _sut.Analyze(entries, start, end);

        // Assert
        result.TotalEntriesAnalyzed.Should().Be(10);
    }

    [Fact]
    public void Analyze_AllInsights_HaveConfidenceAtLeast06()
    {
        // Arrange — enough entries for sub-analysers to fire
        var entries = BuildDiverseEntries(14);
        var start = entries.Min(e => e.EntryDate);
        var end = entries.Max(e => e.EntryDate);

        // Act
        var result = _sut.Analyze(entries, start, end);

        // Assert — every returned insight must meet the MinConfidence threshold
        result.Insights.Should().AllSatisfy(i =>
            i.Confidence.Should().BeGreaterThanOrEqualTo(0.6m));
    }

    [Fact]
    public void Analyze_WhenEnergyTrendingUp_DetectsEnergyTrendInsight()
    {
        // Arrange — 12 entries where energy clearly rises in the second half
        var entries = new List<JournalEntry>();
        for (var i = 0; i < 6; i++)
        {
            entries.Add(new JournalEntry
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Mood = "okay",
                Emotions = [],
                EnergyLevel = 2,       // low first half
                Content = "Early",
                EntryDate = D(2025, 1, i + 1)
            });
        }
        for (var i = 6; i < 12; i++)
        {
            entries.Add(new JournalEntry
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Mood = "great",
                Emotions = [],
                EnergyLevel = 9,       // high second half
                Content = "Later",
                EntryDate = D(2025, 1, i + 1)
            });
        }

        var start = D(2025, 1, 1);
        var end = D(2025, 1, 12);

        // Act
        var result = _sut.Analyze(entries, start, end);

        // Assert
        result.Insights.Should().Contain(i => i.InsightType == "energy_trend");
    }

    [Fact]
    public void Analyze_WhenFrequentEmotion_DetectsEmotionFrequencyInsight()
    {
        // Arrange — 10 entries all tagged with the same emotion (>40% threshold)
        var entries = Enumerable.Range(1, 10)
            .Select(i => new JournalEntry
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Mood = "good",
                Emotions = ["Anxious"],  // 100% frequency — well above 40% threshold
                EnergyLevel = 5,
                Content = $"Entry {i}",
                EntryDate = D(2025, 2, i)
            })
            .ToList();

        var start = D(2025, 2, 1);
        var end = D(2025, 2, 10);

        // Act
        var result = _sut.Analyze(entries, start, end);

        // Assert
        result.Insights.Should().Contain(i =>
            i.InsightType == "emotion_frequency" &&
            i.Title.Contains("anxious", StringComparison.OrdinalIgnoreCase));
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private static List<JournalEntry> BuildDiverseEntries(int count)
    {
        var moods = new[] { "great", "good", "okay", "low", "tough" };
        var emotions = new[] { "Happy", "Anxious", "Peaceful", "Stressed" };

        return Enumerable.Range(1, count)
            .Select(i => new JournalEntry
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Mood = moods[i % moods.Length],
                Emotions = [emotions[i % emotions.Length]],
                EnergyLevel = (i % 10) + 1,
                Content = $"Entry {i}",
                EntryDate = D(2025, 3, i)
            })
            .ToList();
    }
}
