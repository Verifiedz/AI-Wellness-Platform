using ChatService.APIs.Providers;
using ChatService.Interfaces;
using ChatService.Services;

namespace ChatService;

public static class DependencyInjectionContainer
{
    public static void RegisterServices(this IServiceCollection services, IConfiguration configuration)
    {

        var chatOptions = new ChatServiceOptions();
        configuration.Bind(nameof(ChatServiceOptions), chatOptions);

        services.AddSingleton(chatOptions);
        
        services.AddSingleton<IConfigurationService, ConfigurationService>();
        services.AddScoped<IChatDatabaseProvider, ChatDatabaseProvider>();


 
    }
}
