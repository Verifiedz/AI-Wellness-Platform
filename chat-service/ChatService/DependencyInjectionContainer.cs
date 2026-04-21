using System.Threading.RateLimiting;
using ChatService.APIs.Clients;
using ChatService.APIs.Providers;
using ChatService.Interfaces;
using ChatService.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using RedisRateLimiting;
using RedisRateLimiting.AspNetCore;
using StackExchange.Redis;
namespace ChatService;

public static class DependencyInjectionContainer
{
    public static void RegisterServices(this IServiceCollection services, IConfiguration configuration)
    {

        var chatOptions = new ChatServiceOptions();
        configuration.GetSection("ChatService").Bind(chatOptions);
        chatOptions.PostgreSqlConnectionString = configuration.GetConnectionString("PostgreSqlConnectionString");

        services.AddSingleton(chatOptions);

        services.AddSingleton<Ganss.Xss.HtmlSanitizer>(_ =>
        {
            var sanitizer = new Ganss.Xss.HtmlSanitizer();
            sanitizer.AllowedTags.Clear();
            sanitizer.AllowedAttributes.Clear();
            return sanitizer;
        });

        services.AddSingleton<IConfigurationService, ConfigurationService>();
        services.AddScoped<IChatService, Services.ChatService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<ISessionDatabaseProvider, SessionDatabaseProvider>();
        services.AddScoped<IChatDatabaseProvider, ChatDatabaseProvider>();

        services.AddHttpClient<IChatWrapperClientInterface, ChatWrapperClient>((serviceProvider, client) =>
            {
            var configService = serviceProvider.GetRequiredService<IConfigurationService>();

            client.BaseAddress = new Uri(configService.GetBaseUrl());
            client.DefaultRequestHeaders.Add("X-Internal-Api-Key", configService.GetApiKey());
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

      // Per-user rate limit for chat endpoints. When a Redis connection is
      // configured we use a Redis-backed fixed-window limiter so counters are
      // shared across every chat-service replica; otherwise we fall back to
      // the in-memory limiter (suitable for single-instance local dev).
      var redisConnectionString = configuration.GetConnectionString("Redis");
      IConnectionMultiplexer? chatRedisConnection = null;
      if (!string.IsNullOrWhiteSpace(redisConnectionString))
      {
          chatRedisConnection = ConnectionMultiplexer.Connect(redisConnectionString);
          services.AddSingleton(chatRedisConnection);
      }

      services.AddRateLimiter(options =>
      {
          options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
          options.AddPolicy("PerUser", context =>
          {
              var partitionKey = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                  ?? context.Connection.RemoteIpAddress?.ToString()
                  ?? "anonymous";

              if (chatRedisConnection is not null)
              {
                  // RedisRateLimiting 1.1.0: the partitionKey IS the Redis key suffix —
                  // there is no separate RedisKey property on the options type. Prefix
                  // the partitionKey instead so the on-disk keys stay namespaced.
                  return RedisRateLimitPartition.GetFixedWindowRateLimiter(
                      partitionKey: $"sakina:ratelimit:chat:peruser:{partitionKey}",
                      factory: _ => new RedisFixedWindowRateLimiterOptions
                      {
                          ConnectionMultiplexerFactory = () => chatRedisConnection,
                          PermitLimit = 30,
                          Window = TimeSpan.FromMinutes(1),
                      });
              }

              return RateLimitPartition.GetFixedWindowLimiter(
                  partitionKey: partitionKey,
                  factory: _ => new FixedWindowRateLimiterOptions
                  {
                      PermitLimit = 30,
                      Window = TimeSpan.FromMinutes(1),
                      QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                      QueueLimit = 0
                  });
          });
      });

      services.AddStackExchangeRedisCache(options =>
      {
        options.Configuration = configuration.GetConnectionString("Redis");
        options.InstanceName = "AIWellness_";
      });

      services.AddScoped<ICacheServiceProvider, CacheServiceProvider>();

      // Field-level encryption for chat messages (Issue 10).
      //
      // Messages at rest in chatservicedb are now encrypted with a key ring
      // shared across every replica via Redis. If Redis is not configured we
      // fall back to a local keys directory so dev data survives restarts.
      var chatDpBuilder = services
          .AddDataProtection()
          .SetApplicationName("sakina-chat-service");

      if (chatRedisConnection is not null)
      {
          chatDpBuilder.PersistKeysToStackExchangeRedis(chatRedisConnection, "sakina:dataprotection:chat");
      }
      else
      {
          var keyDir = configuration["DataProtection:KeyPath"] ?? "/var/keys/chat";
          Directory.CreateDirectory(keyDir);
          chatDpBuilder.PersistKeysToFileSystem(new DirectoryInfo(keyDir));
      }

      services.AddSingleton<IFieldProtector, FieldProtector>();
    }
}
