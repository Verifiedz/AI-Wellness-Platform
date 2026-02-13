using ChatService.APIs.Providers;
using ChatService.Interfaces;
using ChatService.Services;
using ChatService.APIs.Clients;
namespace ChatService;

public static class DependencyInjectionContainer
{
    public static void RegisterServices(this IServiceCollection services, IConfiguration configuration)
    {

        var chatOptions = new ChatServiceOptions();
        configuration.GetSection("ChatService").Bind(chatOptions);
        chatOptions.PostgreSqlConnectionString = configuration.GetConnectionString("PostgreSqlConnectionString");

        services.AddSingleton(chatOptions);
        
        services.AddSingleton<IConfigurationService, ConfigurationService>();
        services.AddScoped<IChatService,chatService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<ISessionDatabaseProvider, SessionDatabaseProvider>();
        services.AddScoped<IChatDatabaseProvider, ChatDatabaseProvider>();
        
        services.AddHttpClient<IChatWrapperClientInterface, ChatWrapperClient>((serviceProvider,client) =>

            {
            var configService = serviceProvider.GetRequiredService<IConfigurationService>();
            
            client.BaseAddress = new Uri(configService.getBaseUrl());
            client.DefaultRequestHeaders.Add("X-API-KEY", configService.getApiKey());
            }).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler {
              AutomaticDecompression = System.Net.DecompressionMethods.All
              });

      services.AddAuthentication("Bearer")
        .AddJwtBearer("Bearer", options =>
        {
            options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                    System.Text.Encoding.UTF8.GetBytes(configuration["Jwt:Key"]))
            };
        });

      services.AddAuthorization();

      services.AddStackExchangeRedisCache(options =>
      {
        options.Configuration = configuration.GetConnectionString("Redis"); 
        options.InstanceName = "AIWellness_";
      });

      services.AddScoped<ICacheServiceProvider, CacheServiceProvider>();         
 
    }
}

