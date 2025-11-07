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
    public string getApiKey(string apiKey)
    {
        return _chatServiceOptions.ApiKey;
    }

    public string getConnectionString()
    {
       return _chatServiceOptions.PostgreSqlConnectionString;
    }



}