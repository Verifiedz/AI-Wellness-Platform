using ChatService.Entities;
using ChatService.Interfaces;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;

public class SessionDatabaseProvider : ISessionDatabaseProvider
{
    private readonly IConfigurationService _configuration;
    private readonly NpgsqlDataSource _datasource;
    private readonly ILogger<SessionDatabaseProvider> _logger;

    private readonly Dictionary<string, string> storeProceduresCall = new()
    {
        {"create", "CALL public.session_create_storeprocedure($1,$2,$3,$4)"},
        {"set_bookmark", "CALL public.session_set_bookmark_storeprocedure($1,$2)"},
        {"select", "SELECT * FROM public.session_select_fuction($1)"},
        {"select_by_user", "SELECT * FROM public.session_select_function_by_user($1)"},
        {"delete", "CALL public.session_delete_storeprocedure($1)"},
        {"update_name", "CALL public.session_update_name_storeprocedure($1,$2)"}
    };

    public SessionDatabaseProvider(IConfigurationService configuration, ILogger<SessionDatabaseProvider> logger)
    {
        _configuration = configuration;
        _logger = logger;
        var connectionstring = _configuration.GetConnectionString();
        _datasource = NpgsqlDataSource.Create(connectionstring);
    }

    public async Task CreateSessionAsync(ChatSession chatSession)
    {
        using var conn = await _datasource.OpenConnectionAsync();
        _logger.LogDebug("Executing stored procedure: {Procedure}", selectStoreProcedure("create"));

        using var command = new NpgsqlCommand(selectStoreProcedure("create"), conn);

        command.Parameters.AddWithValue(chatSession.SessionId);
        command.Parameters.AddWithValue(chatSession.UserId);
        command.Parameters.AddWithValue(chatSession.CreatedDate);
        command.Parameters.AddWithValue(chatSession.IsBookmarked);

        await command.ExecuteNonQueryAsync();
    }

    public async Task<ChatSession> GetSessionAsync(Guid sessionId)
    {
        var connectionstring = _configuration.GetConnectionString();
        using var conn = new NpgsqlConnection(connectionstring);
        await conn.OpenAsync();

        using var command = new NpgsqlCommand(selectStoreProcedure("select"), conn);

        command.Parameters.AddWithValue(sessionId);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return MapReaderToSession(reader);
        }

        return null;
    }

    public async Task SetBookmarkAsync(Guid sessionId, bool isBookmarked)
    {
        using var conn = await _datasource.OpenConnectionAsync();
        using var command = new NpgsqlCommand(selectStoreProcedure("set_bookmark"), conn);
        command.Parameters.AddWithValue(sessionId);
        command.Parameters.AddWithValue(isBookmarked);
        await command.ExecuteNonQueryAsync();
    }

    public async Task<IReadOnlyList<ChatSession>> GetSessionsByUserAsync(Guid userId)
    {
        var sessions = new List<ChatSession>();
        using var conn = await _datasource.OpenConnectionAsync();

        using var command = new NpgsqlCommand(selectStoreProcedure("select_by_user"), conn);

        command.Parameters.AddWithValue(userId);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            sessions.Add(MapReaderToSession(reader));
        }

        return sessions;
    }

    public async Task DeleteSessionAsync(Guid sessionId)
    {
        using var conn = await _datasource.OpenConnectionAsync();
        using var command = new NpgsqlCommand(selectStoreProcedure("delete"), conn);
        command.Parameters.AddWithValue(sessionId);
        await command.ExecuteNonQueryAsync();
    }

    public async Task UpdateSessionNameAsync(Guid sessionId, string sessionName)
    {
        using var conn = await _datasource.OpenConnectionAsync();
        using var command = new NpgsqlCommand(selectStoreProcedure("update_name"), conn);
        command.Parameters.AddWithValue(sessionId);
        command.Parameters.AddWithValue(sessionName);
        await command.ExecuteNonQueryAsync();
    }

    private string selectStoreProcedure(string key)
    {
        return storeProceduresCall.TryGetValue(key, out var sql)
            ? sql
            : throw new KeyNotFoundException($"Stored procedure '{key}' not found.");
    }

    private ChatSession MapReaderToSession(NpgsqlDataReader reader)
    {
        return new ChatSession
        {
            SessionId = reader.GetGuid(0),
            UserId = reader.GetGuid(1),
            CreatedDate = reader.GetDateTime(2),
            IsBookmarked = reader.GetBoolean(3),
            SessionName = reader.IsDBNull(4) ? null : reader.GetString(4)
        };
    }
}
