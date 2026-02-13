using System.Collections;
using ChatService.Interfaces;

namespace ChatService.Services;

public class ConfigurationService : IConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly ChatServiceOptions _chatServiceOptions;

    public ConfigurationService(IConfiguration config, ChatServiceOptions options)
    {
        _configuration = config;
        _chatServiceOptions = options;
    }
    public string getApiKey()
    {
        return _chatServiceOptions.ApiKey;
    }

    public string getConnectionString()
    {
       return _chatServiceOptions.PostgreSqlConnectionString;
    }

    public string getBaseUrl(){
      return _chatServiceOptions.BaseUrl;
    }

}
