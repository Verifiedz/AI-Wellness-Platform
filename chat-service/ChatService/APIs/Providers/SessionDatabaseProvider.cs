using ChatService.entities;
using ChatService.Interfaces;
using Npgsql;

public class SessionDatabaseProvider: ISessionDatabaseProvider{

  private readonly IConfigurationService _configuration;
  private readonly NpgsqlDataSource _datasource;

  private readonly Dictionary<string,string> storeProceduresCall = new (){
    {"create","CALL public.session_create_storeprocedure($1,$2,$3,$4,$5,$6)"},
    {"select","SELECT * FROM public.session_select_fuction($1)"}
  };
  
  public SessionDatabaseProvider(IConfigurationService configuration)
  {
    _configuration = configuration;
    var connectionstring = _configuration.getConnectionString();
    _datasource = NpgsqlDataSource.Create(connectionstring);
  }

  public async Task createSessionAsync(ChatSession chatSession){
    var connectionstring = _configuration.getConnectionString();
    using var conn = new NpgsqlConnection(connectionstring);
    await conn.OpenAsync();
    Console.WriteLine(selectStoreProcedure("create"));
    

    using var command = new NpgsqlCommand(selectStoreProcedure("create"),conn);
    
    command.Parameters.AddWithValue(chatSession.sessionID.ToString(), NpgsqlTypes.NpgsqlDbType.Uuid);
    command.Parameters.AddWithValue(chatSession.UserId.ToString(), NpgsqlTypes.NpgsqlDbType.Integer);
    command.Parameters.AddWithValue(chatSession.createdDate.ToString(),NpgsqlTypes.NpgsqlDbType.TimestampTz);
    command.Parameters.AddWithValue(chatSession.isBookmarked.ToString(),NpgsqlTypes.NpgsqlDbType.Boolean);
    
    await command.ExecuteNonQueryAsync();
  }

  public async Task<ChatSession> getSessionAsync(Guid sessionID){
    var connectionstring = _configuration.getConnectionString();
    using var conn = new NpgsqlConnection(connectionstring);
    await conn.OpenAsync();

    using var command = new NpgsqlCommand(selectStoreProcedure("select"),conn);

    
    using var reader = await command.ExecuteReaderAsync();

    if(!await reader.ReadAsync()){
      return null;  
    } 
    return new ChatSession {
      sessionID = reader.GetGuid(0),
      UserId = reader.GetInt32(1),
      createdDate = reader.GetDateTime(2),
      isBookmarked = reader.GetBoolean(3),
    };
  }

  public async Task setBookmarkAsync(Guid sessionID, bool isBookmarked){
    throw new NotImplementedException();
  }
  public async Task<IReadOnlyList<ChatSession>> getSessionsbyUserAsync(int UserId){
    throw new NotImplementedException();
  }
  private string selectStoreProcedure(string key)
  {
    return storeProceduresCall.TryGetValue(key, out var sql)
        ? sql
        : throw new KeyNotFoundException($"Stored procedure '{key}' not found.");
  }

}
