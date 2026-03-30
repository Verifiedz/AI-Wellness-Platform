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
    public string GetApiKey()
    {
        return _chatServiceOptions.ApiKey;
    }

    public string GetConnectionString()
    {
       return _chatServiceOptions.PostgreSqlConnectionString;
    }

    public string GetBaseUrl()
    {
      return _chatServiceOptions.BaseUrl;
    }
}
