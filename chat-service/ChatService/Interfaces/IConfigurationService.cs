using System.Diagnostics;
using System.Security.AccessControl;

namespace ChatService.Interfaces;

public interface IConfigurationService
{

    public string getApiKey(string apiKey);

    public string getConnectionString();
}
