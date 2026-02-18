using ChatService.entities;
using ChatService.Interfaces;
using Npgsql;
using NpgsqlTypes;

public class SessionDatabaseProvider: ISessionDatabaseProvider{

  private readonly IConfigurationService _configuration;
  private readonly NpgsqlDataSource _datasource;

  private readonly Dictionary<string,string> storeProceduresCall = new (){
    {"create","CALL public.session_create_storeprocedure($1,$2,$3,$4)"},
    {"select","SELECT * FROM public.session_select_fuction($1)"},
    {"select_by_user", "SELECT * FROM public.session_select_function_by_user($1)"}
  };
  
  public SessionDatabaseProvider(IConfigurationService configuration)
  {
    _configuration = configuration;
    var connectionstring = _configuration.getConnectionString();
    _datasource = NpgsqlDataSource.Create(connectionstring);
  }

  public async Task createSessionAsync(ChatSession chatSession){
    using var conn = await _datasource.OpenConnectionAsync();
    Console.WriteLine(selectStoreProcedure("create"));
    

    using var command = new NpgsqlCommand(selectStoreProcedure("create"),conn);
    
    command.Parameters.AddWithValue(chatSession.sessionID);
    command.Parameters.AddWithValue(chatSession.UserId);
    command.Parameters.AddWithValue(chatSession.createdDate);
    command.Parameters.AddWithValue(chatSession.isBookmarked);
    
    await command.ExecuteNonQueryAsync();
  }

  public async Task<ChatSession> getSessionAsync(Guid sessionID){
    var connectionstring = _configuration.getConnectionString();
    using var conn = new NpgsqlConnection(connectionstring);
    await conn.OpenAsync();

    using var command = new NpgsqlCommand(selectStoreProcedure("select"),conn);   

    command.Parameters.AddWithValue(sessionID);

    using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return MapReaderToSession(reader);
        }

        return null;

  }

  public async Task setBookmarkAsync(Guid sessionID, bool isBookmarked){
    throw new NotImplementedException();
  }
  public async Task<IReadOnlyList<ChatSession>> getSessionsbyUserAsync(Guid UserId){
    var sessions = new List<ChatSession>();
    using var conn = await _datasource.OpenConnectionAsync();
    
   using var command = new NpgsqlCommand(selectStoreProcedure("select_by_user"), conn);

   command.Parameters.AddWithValue(UserId);

   using var reader = await command.ExecuteReaderAsync();

   while (await reader.ReadAsync()){
    sessions.Add(MapReaderToSession(reader));
   }
   
   return sessions; 
  }
  private string selectStoreProcedure(string key)
  {
    return storeProceduresCall.TryGetValue(key, out var sql)
        ? sql
        : throw new KeyNotFoundException($"Stored procedure '{key}' not found.");
  }
  private ChatSession MapReaderToSession(NpgsqlDataReader reader){

    return new ChatSession{
      sessionID = reader.GetGuid(0),
      UserId = reader.GetGuid(1),
      createdDate = reader.GetDateTime(2),
      isBookmarked = reader.GetBoolean(3)
    };
  }

}
