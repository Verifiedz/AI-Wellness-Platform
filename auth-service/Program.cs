using AIWellness.Auth.Middleware;
using AIWellness.Auth.Repositories;
using AIWellness.Auth.Services;
using AIWellness.Auth.Services.Abstractions;
using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using RedisRateLimiting;
using RedisRateLimiting.AspNetCore;
using Serilog;
using Serilog.Formatting.Compact;
using StackExchange.Redis;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Yarp.ReverseProxy.Transforms;

// Bootstrap Serilog before the host is built so that startup failures are
// captured in the same structured JSON format as request logs. We emit to
// stdout as compact JSON (CLEF) which is ingestible by container log
// aggregators (Datadog, Loki, CloudWatch).
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "auth-service")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "auth-service")
    .WriteTo.Console(new CompactJsonFormatter()));

builder.WebHost.UseSentry(options =>
{
  options.Dsn = builder.Configuration["Sentry:Dsn"] ?? string.Empty;
  options.Environment = builder.Environment.EnvironmentName;
  options.Release = typeof(Program).Assembly.GetName().Version?.ToString();
  options.TracesSampleRate = builder.Configuration.GetValue("Sentry:TracesSampleRate", 0.1);
  options.SendDefaultPii = false;
  options.AttachStacktrace = true;
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHttpContextAccessor();

var maxRequestsPerMinute = builder.Configuration.GetValue("RateLimiting:MaxRequestsPerMinute", 100);
var maxLoginAttemptsPerMinute = builder.Configuration.GetValue("RateLimiting:MaxLoginAttemptsPerMinute", 5);

// Shared Redis connection used by the rate limiter. We register it as a
// singleton so the multiplexer (which is expensive to create) is reused for
// the lifetime of the process. If Redis is unreachable at startup we still
// want the service to come up — the rate limiter will fall back to rejecting
// on the Redis path, which surfaces clearly in Sentry/Serilog.
var redisConnectionString = builder.Configuration["Redis:ConnectionString"]
    ?? throw new InvalidOperationException(
        "Redis:ConnectionString is required for distributed rate limiting. " +
        "Set it in appsettings or the REDIS__CONNECTIONSTRING env var.");

var redisConnection = ConnectionMultiplexer.Connect(redisConnectionString);
builder.Services.AddSingleton<IConnectionMultiplexer>(redisConnection);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global per-IP rate limit: 100 req/min fixed window, counters stored in
    // Redis so multiple auth-service replicas share the same budget. This is
    // the core App-Store-readiness fix: in-memory limiters were per-instance
    // and could be trivially bypassed by bouncing between replicas.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RedisRateLimitPartition.GetFixedWindowRateLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: key => new RedisFixedWindowRateLimiterOptions
            {
                ConnectionMultiplexerFactory = () => redisConnection,
                PermitLimit = maxRequestsPerMinute,
                Window = TimeSpan.FromMinutes(1),
                // Prefix so we can see and clear auth counters in redis-cli.
                RedisKey = $"sakina:ratelimit:global:{key}",
            }));

    // Named policy for stricter login rate limit (5/min by default).
    options.AddPolicy("login", httpContext =>
        RedisRateLimitPartition.GetFixedWindowRateLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: key => new RedisFixedWindowRateLimiterOptions
            {
                ConnectionMultiplexerFactory = () => redisConnection,
                PermitLimit = maxLoginAttemptsPerMinute,
                Window = TimeSpan.FromMinutes(1),
                RedisKey = $"sakina:ratelimit:login:{key}",
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        var ip = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        logger.LogWarning("Rate limit exceeded for IP {ClientIp} on {Path}", ip, context.HttpContext.Request.Path);

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        // Advertise a conservative Retry-After so clients back off even if our
        // fixed window has less remaining time than 60s.
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        await context.HttpContext.Response.WriteAsync("Too many requests. Please try again later.", cancellationToken);
    };
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is missing");
builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = builder.Configuration["Jwt:Issuer"],
    ValidAudience = builder.Configuration["Jwt:Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
  };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowFrontend", policy =>
  {
    if (builder.Environment.IsDevelopment())
    {
      policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    }
    else
    {
      var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
      if (allowedOrigins.Length > 0)
      {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
      }
      else
      {
        // Explicitly block cross-origin requests if production origins are not configured.
        policy.SetIsOriginAllowed(_ => false)
              .AllowAnyMethod()
              .AllowAnyHeader();
      }
    }
  });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddTransforms(context =>
    {
      context.AddRequestTransform(transformContext =>
      {
        var user = transformContext.HttpContext.User;
        if (user.Identity?.IsAuthenticated == true)
        {
          var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
          var email = user.FindFirst(ClaimTypes.Email)?.Value;

          if (userId is not null)
            transformContext.ProxyRequest.Headers.TryAddWithoutValidation("X-User-Id", userId);
          if (email is not null)
            transformContext.ProxyRequest.Headers.TryAddWithoutValidation("X-User-Email", email);
        }

        // Inject community-service API key for gateway auth (SEC-03)
        var config = transformContext.HttpContext.RequestServices
            .GetRequiredService<IConfiguration>();
        var communityApiKey = config["CommunityService:ApiKey"];
        if (!string.IsNullOrEmpty(communityApiKey))
            transformContext.ProxyRequest.Headers.TryAddWithoutValidation(
                "X-Internal-Api-Key", communityApiKey);

        // Propagate correlation id to downstream services so a single request
        // can be traced across the whole stack.
        if (transformContext.HttpContext.Items.TryGetValue(
                CorrelationIdMiddleware.HttpContextKey, out var idObj)
            && idObj is string id)
        {
          transformContext.ProxyRequest.Headers.TryAddWithoutValidation(
              CorrelationIdMiddleware.HeaderName, id);
        }

        return ValueTask.CompletedTask;
      });
    });

builder.Services.AddHttpClient<INotificationService, NotificationService>((serviceProvider, client) =>
{
  var config = serviceProvider.GetRequiredService<IConfiguration>();
  client.BaseAddress = new Uri(config["NotificationService:BaseUrl"]
      ?? throw new InvalidOperationException("NotificationService:BaseUrl not configured"));

  var apiKey = config["NotificationService:ApiKey"];
  if (!string.IsNullOrEmpty(apiKey))
    client.DefaultRequestHeaders.Add("X-Internal-Api-Key", apiKey);
})
.AddHttpMessageHandler<CorrelationIdPropagationHandler>();

// Named HttpClients for the account-deletion cascade. Each targets a downstream
// service's /internal/users/{id} DELETE endpoint, authenticated with a per-service
// shared secret (the same one YARP injects). Short timeout keeps the user-facing
// DELETE /api/auth/me responsive even when a downstream is slow.
static void AddInternalDeletionClient(
    WebApplicationBuilder b,
    string clientName,
    string baseUrlConfigKey,
    string apiKeyConfigKey)
{
  b.Services.AddHttpClient(clientName, (sp, client) =>
  {
    var config = sp.GetRequiredService<IConfiguration>();
    var baseUrl = config[baseUrlConfigKey];
    if (!string.IsNullOrWhiteSpace(baseUrl))
      client.BaseAddress = new Uri(baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/");

    var apiKey = config[apiKeyConfigKey];
    if (!string.IsNullOrEmpty(apiKey))
      client.DefaultRequestHeaders.Add("X-Internal-Api-Key", apiKey);

    client.Timeout = TimeSpan.FromSeconds(10);
  })
  .AddHttpMessageHandler<CorrelationIdPropagationHandler>();
}

builder.Services.AddTransient<CorrelationIdPropagationHandler>();

AddInternalDeletionClient(builder, AIWellness.Auth.Services.UserDataDeletionClient.JournalClient,
    "InternalServices:Journal:BaseUrl", "InternalServices:Journal:ApiKey");
AddInternalDeletionClient(builder, AIWellness.Auth.Services.UserDataDeletionClient.ChatClient,
    "InternalServices:Chat:BaseUrl", "InternalServices:Chat:ApiKey");
AddInternalDeletionClient(builder, AIWellness.Auth.Services.UserDataDeletionClient.CommunityClient,
    "InternalServices:Community:BaseUrl", "InternalServices:Community:ApiKey");
AddInternalDeletionClient(builder, AIWellness.Auth.Services.UserDataDeletionClient.NotificationClient,
    "InternalServices:Notification:BaseUrl", "InternalServices:Notification:ApiKey");

builder.Services.AddScoped<IUserDataDeletionClient, UserDataDeletionClient>();

builder.Services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<AIWellness.Auth.Services.Abstractions.IPasswordHasher, AIWellness.Auth.Services.BcryptPasswordHasher>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordValidator, PasswordValidator>();
builder.Services.AddScoped<ISecurityAuditService, SecurityAuditService>();

builder.Services.AddLogging();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.MapReverseProxy();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
  app.MapGet("/db-test", async (IDbConnectionFactory dbFactory, ILogger<Program> logger) =>
  {
    try
    {
      using var connection = dbFactory.CreateConnection();
      var userCount = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM users");
      var tables = await connection.QueryAsync<string>(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
      return Results.Ok(new
      {
        Status = "Database connected successfully!",
        UserCount = userCount,
        Tables = tables.ToList()
      });
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "Database test failed");
      return Results.Problem($"Database error: {ex.Message}");
    }
  });
}

app.Run();
