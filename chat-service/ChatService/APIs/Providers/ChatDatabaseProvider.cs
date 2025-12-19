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
        {"create", "CALL public.chat_create_storeprocedure($1,$2,$3,$4,$5,$6)"},
        {"update", "CALL public.chat_update_storeprocedure($1,$2,$3,$4,$5,$6)"},
        {"delete", "CALL public.chat_delete_storeprocedure($1)"},
        {"select", "SELECT * FROM public.chat_select_function($1)"}
    };

    public ChatDatabaseProvider(IConfigurationService configuration)
    {
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

        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.Integer, chat.chatUserId);
        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.Uuid, chat.chatReferenceId);
        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.Varchar, chat.message);
        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.Varchar, chat.status.ToString());
        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.Boolean, chat.isBookmarked);
        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.TimestampTz, chat.CreatedDate);

        await command.ExecuteNonQueryAsync();
    }

    public async Task deleteChatAsync(Guid chatReferenceId)
    {
        var connectionString = _configuration.getConnectionString();
        using var conn = new NpgsqlConnection(connectionString);

        await conn.OpenAsync();
        using var command = new NpgsqlCommand(selectStoreProcedure("delete"), conn);

        command.Parameters.AddWithValue(NpgsqlTypes.NpgsqlDbType.Uuid, chatReferenceId);
        await command.ExecuteNonQueryAsync();

    }

    public async Task<Chat?> getChatAsync(Guid chatReferenceId)
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
            chatUserId = reader.GetInt32(1),
            message = reader.GetString(2),
            status = Enum.Parse<Status>(reader.GetString(3)),
            isBookmarked = reader.GetBoolean(4),
            CreatedDate = reader.GetDateTime(5),
        };
    }
    public async Task setIsBookmarkedAsync(bool isBookmarked)
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

