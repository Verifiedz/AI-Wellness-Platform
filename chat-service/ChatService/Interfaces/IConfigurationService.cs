
namespace ChatService.Interfaces;

public interface IConfigurationService
{
     public string GetApiKey();

     public string GetConnectionString();

     public string GetBaseUrl();
}
