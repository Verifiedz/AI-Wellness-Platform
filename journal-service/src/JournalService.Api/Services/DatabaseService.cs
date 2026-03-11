namespace JournalService.Api.Services;

using JournalService.Api.Infrastructure;
using JournalService.Api.Models.Entities;
using Npgsql;
using NpgsqlTypes;

public class DatabaseService
{
    private readonly StoredProcedureExecutor _executor;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(
        StoredProcedureExecutor executor,
        ILogger<DatabaseService> logger)
    {
        _executor = executor;
        _logger = logger;
    }

    #region Journal Entries

    public async Task<JournalEntry?> CreateJournalEntryAsync(
        Guid userId,
        string mood,
        string[] emotions,
        int energyLevel,
        string content,
        DateOnly entryDate)
    {
        _logger.LogInformation("Creating journal entry for user {UserId} on {EntryDate}", userId, entryDate);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_mood", NpgsqlDbType.Varchar) { Value = mood },
            new NpgsqlParameter("p_emotions", NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = emotions },
            new NpgsqlParameter("p_energy_level", NpgsqlDbType.Integer) { Value = energyLevel },
            new NpgsqlParameter("p_content", NpgsqlDbType.Text) { Value = content },
            new NpgsqlParameter("p_entry_date", NpgsqlDbType.Date) { Value = entryDate.ToDateTime(TimeOnly.MinValue) }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_create_journal_entry",
            parameters,
            MapJournalEntry);
    }

    public async Task<List<JournalEntry>> GetJournalEntriesByUserAsync(
        Guid userId,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        int limit = 50,
        int offset = 0)
    {
        _logger.LogDebug("Getting journal entries for user {UserId}", userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_start_date", NpgsqlDbType.Date)
            {
                Value = startDate.HasValue ? startDate.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value
            },
            new NpgsqlParameter("p_end_date", NpgsqlDbType.Date)
            {
                Value = endDate.HasValue ? endDate.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value
            },
            new NpgsqlParameter("p_limit", NpgsqlDbType.Integer) { Value = limit },
            new NpgsqlParameter("p_offset", NpgsqlDbType.Integer) { Value = offset }
        };

        return await _executor.ExecuteReaderAsync(
            "sp_get_journal_entries_by_user",
            parameters,
            MapJournalEntry);
    }

    public async Task<JournalEntry?> GetJournalEntryByIdAsync(Guid entryId, Guid userId)
    {
        _logger.LogDebug("Getting journal entry {EntryId} for user {UserId}", entryId, userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_entry_id", NpgsqlDbType.Uuid) { Value = entryId },
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_get_journal_entry_by_id",
            parameters,
            MapJournalEntry);
    }

    public async Task<JournalEntry?> GetJournalEntryByDateAsync(Guid userId, DateOnly entryDate)
    {
        _logger.LogDebug("Getting journal entry for user {UserId} on {EntryDate}", userId, entryDate);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_entry_date", NpgsqlDbType.Date) { Value = entryDate.ToDateTime(TimeOnly.MinValue) }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_get_journal_entry_by_date",
            parameters,
            MapJournalEntry);
    }

    public async Task<JournalEntry?> UpdateJournalEntryAsync(
        Guid entryId,
        Guid userId,
        string mood,
        string[] emotions,
        int energyLevel,
        string content)
    {
        _logger.LogInformation("Updating journal entry {EntryId} for user {UserId}", entryId, userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_entry_id", NpgsqlDbType.Uuid) { Value = entryId },
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_mood", NpgsqlDbType.Varchar) { Value = mood },
            new NpgsqlParameter("p_emotions", NpgsqlDbType.Array | NpgsqlDbType.Text) { Value = emotions },
            new NpgsqlParameter("p_energy_level", NpgsqlDbType.Integer) { Value = energyLevel },
            new NpgsqlParameter("p_content", NpgsqlDbType.Text) { Value = content }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_update_journal_entry",
            parameters,
            MapJournalEntry);
    }

    public async Task<bool> DeleteJournalEntryAsync(Guid entryId, Guid userId)
    {
        _logger.LogInformation("Deleting journal entry {EntryId} for user {UserId}", entryId, userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_entry_id", NpgsqlDbType.Uuid) { Value = entryId },
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId }
        };

        var result = await _executor.ExecuteScalarAsync<bool>("sp_delete_journal_entry", parameters);
        return result;
    }

    #endregion

    #region Mood Summary

    public async Task<List<(string Mood, long Count, decimal AvgEnergy)>> GetMoodSummaryAsync(
        Guid userId,
        DateOnly startDate,
        DateOnly endDate)
    {
        _logger.LogDebug("Getting mood summary for user {UserId} from {Start} to {End}", userId, startDate, endDate);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_start_date", NpgsqlDbType.Date) { Value = startDate.ToDateTime(TimeOnly.MinValue) },
            new NpgsqlParameter("p_end_date", NpgsqlDbType.Date) { Value = endDate.ToDateTime(TimeOnly.MinValue) }
        };

        return await _executor.ExecuteReaderAsync(
            "sp_get_mood_summary",
            parameters,
            reader => (
                Mood: reader.GetStringSafe("mood"),
                Count: reader.GetInt64Safe("entry_count"),
                AvgEnergy: reader.GetDecimalSafe("avg_energy")
            ));
    }

    #endregion

    #region Journal Prompts

    public async Task<JournalPrompt?> GetRandomPromptAsync(string? category = null)
    {
        _logger.LogDebug("Getting random journal prompt (category: {Category})", category ?? "any");

        var parameters = new[]
        {
            new NpgsqlParameter("p_category", NpgsqlDbType.Varchar)
            {
                Value = (object?)category ?? DBNull.Value
            }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_get_random_prompt",
            parameters,
            reader => new JournalPrompt
            {
                Id = reader.GetInt32Safe("id"),
                Content = reader.GetStringSafe("content"),
                Category = reader.GetStringSafe("category")
            });
    }

    #endregion

    #region Health Check

    public async Task<bool> TestConnectionAsync()
    {
        return await _executor.TestConnectionAsync();
    }

    #endregion

    private static JournalEntry MapJournalEntry(NpgsqlDataReader reader)
    {
        return new JournalEntry
        {
            Id = reader.GetGuidSafe("id"),
            UserId = reader.GetGuidSafe("user_id"),
            Mood = reader.GetStringSafe("mood"),
            Emotions = reader.GetStringArraySafe("emotions"),
            EnergyLevel = reader.GetInt32Safe("energy_level"),
            Content = reader.GetStringSafe("content"),
            EntryDate = reader.GetDateOnlySafe("entry_date"),
            CreatedAt = reader.GetDateTimeSafe("created_at"),
            UpdatedAt = reader.GetDateTimeSafe("updated_at")
        };
    }
}
