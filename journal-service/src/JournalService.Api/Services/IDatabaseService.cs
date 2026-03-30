namespace JournalService.Api.Services;

using JournalService.Api.Models.Entities;

/// <summary>
/// Abstraction over the journal database layer, enabling unit testing
/// without a live PostgreSQL connection.
/// </summary>
public interface IDatabaseService
{
    Task<JournalEntry?> CreateJournalEntryAsync(
        Guid userId,
        string mood,
        string[] emotions,
        int energyLevel,
        string content,
        DateOnly entryDate);

    Task<List<JournalEntry>> GetJournalEntriesByUserAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        int limit = 50,
        int offset = 0);

    Task<JournalEntry?> GetJournalEntryByIdAsync(Guid entryId, Guid userId);

    Task<JournalEntry?> GetJournalEntryByDateAsync(Guid userId, DateOnly entryDate);

    Task<JournalEntry?> UpdateJournalEntryAsync(
        Guid entryId,
        Guid userId,
        string mood,
        string[] emotions,
        int energyLevel,
        string content);

    Task<bool> DeleteJournalEntryAsync(Guid entryId, Guid userId);

    Task<List<(string Mood, long Count, decimal AvgEnergy)>> GetMoodSummaryAsync(
        Guid userId,
        DateOnly startDate,
        DateOnly endDate);

    Task<JournalPrompt?> GetRandomPromptAsync(string? category = null);

    Task<bool> TestConnectionAsync();
}
