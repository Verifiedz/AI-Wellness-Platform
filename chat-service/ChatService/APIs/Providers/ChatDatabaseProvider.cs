using System.Runtime.CompilerServices;
using ChatService.DTOs;
using ChatService.enums;
using ChatService.Interfaces;
using Npgsql;
namespace ChatService.APIs.Providers;

public class ChatDatabaseProvider : IChatDatabaseProvider
{
    private readonly IConfigurationService _configuration;
    private readonly NpgsqlDataSource _dataSource;

    private readonly Dictionary<string, string> storeProceduresCall = new()
    {
        {"create", "CALL public.chat_create_storeprocedure($1,$2,$3,$4,$5,$6,$7)"},
        {"update", "CALL public.chat_update_storeprocedure($1,$2,$3,$4,$5,$6,$7)"}, 
        {"delete", "CALL public.chat_delete_storeprocedure($1)"}, 
        {"select", "SELECT * FROM public.chat_select_function($1)"},
        {"select_by_session", "SELECT * FROM public.chat_select_by_session_function($1)"}
    };

    public ChatDatabaseProvider(IConfigurationService configuration) {
        _configuration = configuration;
        var connectionString = _configuration.getConnectionString();
        _dataSource = NpgsqlDataSource.Create(connectionString);
    }
    public  async Task createChatAsync(Chat chat)
    {
        var connectionString = _configuration.getConnectionString();
        using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        Console.WriteLine(selectStoreProcedure("create"));
        using var command = new NpgsqlCommand(selectStoreProcedure("create"), conn);

        command.Parameters.AddWithValue(chat.chatUserId);
        command.Parameters.AddWithValue(chat.chatReferenceId);
        command.Parameters.AddWithValue(chat.message);
        command.Parameters.AddWithValue(chat.sessionId);
        command.Parameters.AddWithValue(chat.status.ToString());
        command.Parameters.AddWithValue(chat.isBookmarked);
        command.Parameters.AddWithValue(chat.CreatedDate);

        await command.ExecuteNonQueryAsync();
    }

    public async Task deleteChatAsync(Guid chatReferenceId)
    {
        var connectionString = _configuration.getConnectionString();
        using var conn = new NpgsqlConnection(connectionString);

        await conn.OpenAsync();
        using var command = new NpgsqlCommand(selectStoreProcedure("delete"), conn);

        command.Parameters.AddWithValue (chatReferenceId);
        await command.ExecuteNonQueryAsync();

    }

    public async Task<Chat> getChatAsync(Guid chatReferenceId)
    {
        using var conn = new NpgsqlConnection(_configuration.getConnectionString());
        await conn.OpenAsync();

        using var cmd = new NpgsqlCommand(selectStoreProcedure("select"), conn);
        cmd.Parameters.AddWithValue(chatReferenceId);

        using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return new Chat
        {
            chatReferenceId = reader.GetGuid(0),
            chatUserId = reader.GetGuid(1),
            message = reader.GetString(2),
            sessionId = reader.GetGuid(3),
            status = Enum.Parse<Status>(reader.GetString(4)),
            isBookmarked = reader.GetBoolean(5),
            CreatedDate = reader.GetDateTime(6),
        };
    }

    public async Task<IReadOnlyList<Chat>> getChatsBySessionAsync(Guid sessionId)
{
    var chats = new List<Chat>();

    using var conn = await _dataSource.OpenConnectionAsync();
    using var cmd = new NpgsqlCommand(selectStoreProcedure("select_by_session"), conn);
    
    cmd.Parameters.AddWithValue(sessionId);

    using var reader = await cmd.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        chats.Add(new Chat
        {
            chatReferenceId = reader.GetGuid(0),
            chatUserId = reader.GetGuid(1),
            message = reader.GetString(2),
            sessionId = reader.GetGuid(3),
            status = Enum.Parse<Status>(reader.GetString(4)),
            isBookmarked = reader.GetBoolean(5),
            CreatedDate = reader.GetDateTime(6)
        });
    }

    return chats;
}    public async Task setIsBookmarkedAsync(Guid chatReferenceId)
    {
        throw new NotImplementedException();
    }

    public async Task updateChatAsync(Guid chatReferenceId)
    {
        throw new NotImplementedException();
    }

    private string selectStoreProcedure(string key)
    {
        return storeProceduresCall.TryGetValue(key, out var sql)
            ? sql
            : throw new KeyNotFoundException($"Stored procedure '{key}' not found.");
    }
}

