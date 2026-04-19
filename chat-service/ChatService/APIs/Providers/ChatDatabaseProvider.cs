using ChatService.DTOs;
using ChatService.Enums;
using ChatService.Interfaces;
using Microsoft.Extensions.Logging;
using Npgsql;
namespace ChatService.APIs.Providers;

public class ChatDatabaseProvider : IChatDatabaseProvider
{
    private readonly IConfigurationService _configuration;
    private readonly NpgsqlDataSource _dataSource;
    private readonly ILogger<ChatDatabaseProvider> _logger;

    private readonly Dictionary<string, string> storeProceduresCall = new()
    {
        {"create", "CALL public.chat_create_storeprocedure($1,$2,$3,$4,$5,$6,$7)"},
        {"update", "CALL public.chat_update_storeprocedure($1,$2,$3,$4,$5,$6,$7)"},
        {"delete", "CALL public.chat_delete_storeprocedure($1)"},
        {"select", "SELECT * FROM public.chat_select_function($1)"},
        {"select_by_session", "SELECT * FROM public.chat_select_by_session_function($1,$2,$3)"}
    };

    public ChatDatabaseProvider(IConfigurationService configuration, ILogger<ChatDatabaseProvider> logger) {
        _configuration = configuration;
        _logger = logger;
        var connectionString = _configuration.GetConnectionString();
        _dataSource = NpgsqlDataSource.Create(connectionString);
    }
    public async Task CreateChatAsync(Chat chat, CancellationToken cancellationToken = default)
    {
        var connectionString = _configuration.GetConnectionString();
        using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync(cancellationToken);

        _logger.LogDebug("Executing stored procedure: {Procedure}", selectStoreProcedure("create"));
        using var command = new NpgsqlCommand(selectStoreProcedure("create"), conn);

        command.Parameters.AddWithValue(chat.ChatUserId);
        command.Parameters.AddWithValue(chat.ChatReferenceId);
        command.Parameters.AddWithValue(chat.Message);
        command.Parameters.AddWithValue(chat.SessionId);
        command.Parameters.AddWithValue(chat.Status.ToString());
        command.Parameters.AddWithValue(chat.IsBookmarked);
        command.Parameters.AddWithValue(chat.CreatedDate);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteChatAsync(Guid chatReferenceId)
    {
        var connectionString = _configuration.GetConnectionString();
        using var conn = new NpgsqlConnection(connectionString);

        await conn.OpenAsync();
        using var command = new NpgsqlCommand(selectStoreProcedure("delete"), conn);

        command.Parameters.AddWithValue (chatReferenceId);
        await command.ExecuteNonQueryAsync();

    }

    public async Task<Chat?> GetChatAsync(Guid chatReferenceId, CancellationToken cancellationToken = default)
    {
        using var conn = new NpgsqlConnection(_configuration.GetConnectionString());
        await conn.OpenAsync(cancellationToken);

        using var cmd = new NpgsqlCommand(selectStoreProcedure("select"), conn);
        cmd.Parameters.AddWithValue(chatReferenceId);

        using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
            return null;

        return new Chat
        {
            ChatReferenceId = reader.GetGuid(0),
            ChatUserId = reader.GetGuid(1),
            Message = reader.GetString(2),
            SessionId = reader.GetGuid(3),
            Status = Enum.Parse<Status>(reader.GetString(4)),
            IsBookmarked = reader.GetBoolean(5),
            CreatedDate = reader.GetDateTime(6),
        };
    }

    public async Task<IReadOnlyList<Chat>> GetChatsBySessionAsync(Guid sessionId, int limit, int offset, CancellationToken cancellationToken = default)
    {
        var chats = new List<Chat>();

        using var conn = await _dataSource.OpenConnectionAsync(cancellationToken);
        using var cmd = new NpgsqlCommand(selectStoreProcedure("select_by_session"), conn);

        cmd.Parameters.AddWithValue(sessionId);
        cmd.Parameters.AddWithValue(limit);
        cmd.Parameters.AddWithValue(offset);

        using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            chats.Add(new Chat
            {
                ChatReferenceId = reader.GetGuid(0),
                ChatUserId = reader.GetGuid(1),
                Message = reader.GetString(2),
                SessionId = reader.GetGuid(3),
                Status = Enum.Parse<Status>(reader.GetString(4)),
                IsBookmarked = reader.GetBoolean(5),
                CreatedDate = reader.GetDateTime(6)
            });
        }

        return chats;
    }

    public async Task UpdateChatAsync(Chat chat)
    {
        using var conn = await _dataSource.OpenConnectionAsync();
        using var cmd = new NpgsqlCommand(selectStoreProcedure("update"), conn);
        cmd.Parameters.AddWithValue(chat.ChatUserId);
        cmd.Parameters.AddWithValue(chat.ChatReferenceId);
        cmd.Parameters.AddWithValue(chat.Message);
        cmd.Parameters.AddWithValue(chat.SessionId);
        cmd.Parameters.AddWithValue(chat.Status.ToString());
        cmd.Parameters.AddWithValue(chat.IsBookmarked);
        cmd.Parameters.AddWithValue(chat.CreatedDate);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteChatsByUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        using var conn = await _dataSource.OpenConnectionAsync(cancellationToken);
        using var tx = await conn.BeginTransactionAsync(cancellationToken);
        try
        {
            // Remove all chat messages authored by this user across every session.
            using (var chatCmd = new NpgsqlCommand("DELETE FROM public.chat WHERE chatuserid = $1", conn, tx))
            {
                chatCmd.Parameters.AddWithValue(userId);
                await chatCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            // Then purge the user's sessions themselves.
            using (var sessionCmd = new NpgsqlCommand("DELETE FROM public.session WHERE externaluserid = $1", conn, tx))
            {
                sessionCmd.Parameters.AddWithValue(userId);
                await sessionCmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);
            _logger.LogInformation("Deleted chat data for user {UserId}", userId);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private string selectStoreProcedure(string key)
    {
        return storeProceduresCall.TryGetValue(key, out var sql)
            ? sql
            : throw new KeyNotFoundException($"Stored procedure '{key}' not found.");
    }
}
