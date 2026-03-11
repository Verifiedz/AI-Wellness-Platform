namespace JournalService.Api.Services;

using JournalService.Api.Models.Entities;
using JournalService.Api.Models.Requests;
using JournalService.Api.Models.Responses;

public class JournalEntryService
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<JournalEntryService> _logger;

    private static readonly HashSet<string> ValidEmotions = new(StringComparer.OrdinalIgnoreCase)
    {
        "Happy", "Grateful", "Excited", "Peaceful", "Confident",
        "Anxious", "Sad", "Frustrated", "Overwhelmed", "Lonely",
        "Hopeful", "Proud", "Content", "Worried", "Stressed"
    };

    public JournalEntryService(
        DatabaseService databaseService,
        ILogger<JournalEntryService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    public async Task<JournalEntryResponse> CreateEntryAsync(Guid userId, CreateJournalEntryRequest request)
    {
        ValidateEmotions(request.Emotions);

        var existing = await _databaseService.GetJournalEntryByDateAsync(userId, request.EntryDate);
        if (existing != null)
            throw new ArgumentException($"A journal entry already exists for {request.EntryDate:yyyy-MM-dd}. Use PUT to update it.");

        var entry = await _databaseService.CreateJournalEntryAsync(
            userId,
            request.Mood,
            request.Emotions,
            request.EnergyLevel,
            request.Content,
            request.EntryDate);

        return MapToResponse(entry ?? throw new InvalidOperationException("Failed to create journal entry"));
    }

    public async Task<List<JournalEntryResponse>> GetEntriesAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        int limit = 50,
        int offset = 0)
    {
        var entries = await _databaseService.GetJournalEntriesByUserAsync(userId, startDate, endDate, limit, offset);
        return entries.Select(MapToResponse).ToList();
    }

    public async Task<JournalEntryResponse?> GetEntryByIdAsync(Guid entryId, Guid userId)
    {
        var entry = await _databaseService.GetJournalEntryByIdAsync(entryId, userId);
        return entry != null ? MapToResponse(entry) : null;
    }

    public async Task<JournalEntryResponse?> GetEntryByDateAsync(Guid userId, DateOnly entryDate)
    {
        var entry = await _databaseService.GetJournalEntryByDateAsync(userId, entryDate);
        return entry != null ? MapToResponse(entry) : null;
    }

    public async Task<JournalEntryResponse> UpdateEntryAsync(Guid entryId, Guid userId, UpdateJournalEntryRequest request)
    {
        ValidateEmotions(request.Emotions);

        var entry = await _databaseService.UpdateJournalEntryAsync(
            entryId,
            userId,
            request.Mood,
            request.Emotions,
            request.EnergyLevel,
            request.Content);

        if (entry == null)
            throw new KeyNotFoundException($"Journal entry {entryId} not found or does not belong to this user.");

        return MapToResponse(entry);
    }

    public async Task<bool> DeleteEntryAsync(Guid entryId, Guid userId)
    {
        return await _databaseService.DeleteJournalEntryAsync(entryId, userId);
    }

    public async Task<MoodSummaryResponse> GetMoodSummaryAsync(Guid userId, DateOnly startDate, DateOnly endDate)
    {
        var summary = await _databaseService.GetMoodSummaryAsync(userId, startDate, endDate);

        var moodCounts = summary.Select(s => new MoodCount
        {
            Mood = s.Mood,
            Count = s.Count,
            AverageEnergy = s.AvgEnergy
        }).ToList();

        var totalEntries = moodCounts.Sum(m => (int)m.Count);
        var mostCommon = moodCounts.OrderByDescending(m => m.Count).FirstOrDefault();
        var avgEnergy = totalEntries > 0
            ? Math.Round(moodCounts.Sum(m => m.AverageEnergy * m.Count) / totalEntries, 1)
            : 0m;

        return new MoodSummaryResponse
        {
            TotalEntries = totalEntries,
            MoodCounts = moodCounts,
            MostCommonMood = mostCommon?.Mood,
            AverageEnergy = avgEnergy
        };
    }

    public async Task<JournalPromptResponse?> GetRandomPromptAsync(string? category = null)
    {
        var prompt = await _databaseService.GetRandomPromptAsync(category);
        if (prompt == null) return null;

        return new JournalPromptResponse
        {
            Id = prompt.Id,
            Content = prompt.Content,
            Category = prompt.Category
        };
    }

    private static void ValidateEmotions(string[] emotions)
    {
        var invalid = emotions.Where(e => !ValidEmotions.Contains(e)).ToList();
        if (invalid.Count > 0)
            throw new ArgumentException($"Invalid emotions: {string.Join(", ", invalid)}. " +
                $"Valid emotions are: {string.Join(", ", ValidEmotions.Order())}");
    }

    private static JournalEntryResponse MapToResponse(JournalEntry entry)
    {
        return new JournalEntryResponse
        {
            Id = entry.Id,
            UserId = entry.UserId,
            Mood = entry.Mood,
            Emotions = entry.Emotions,
            EnergyLevel = entry.EnergyLevel,
            Content = entry.Content,
            EntryDate = entry.EntryDate.ToString("yyyy-MM-dd"),
            CreatedAt = entry.CreatedAt,
            UpdatedAt = entry.UpdatedAt
        };
    }
}
