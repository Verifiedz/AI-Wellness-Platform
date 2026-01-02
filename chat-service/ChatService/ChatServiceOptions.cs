namespace ChatService;

public class ChatServiceOptions
{
     public string PostgreSqlConnectionString { get; set; } = string.Empty;
     public string ApiKey { get; set; } = string.Empty;

     public string BaseUrl {get; set;} = string.Empty;
}
