using AIWrapperService.APIs;
using AIWrapperService.Middleware;
using AIWrapperService.Services;
using DotNetEnv;
using Microsoft.AspNetCore.RateLimiting;
using RedisRateLimiting;
using RedisRateLimiting.AspNetCore;
using Serilog;
using Serilog.Formatting.Compact;
using StackExchange.Redis;
using System.Threading.RateLimiting;

// Load .env file if it exists (for local development)
if (File.Exists(".env"))
{
    Env.Load();
}

Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "ai-wrapper-service")
    .WriteTo.Console(new CompactJsonFormatter())
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "ai-wrapper-service")
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

// ===== Service Registration =====

// Add API Explorer and Swagger for development
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "AI Wrapper Service",
        Version = "v1",
        Description = "Stateless HTTP API that normalizes LLM requests/responses for the AI Wellness Platform"
    });

    // Include XML comments for Swagger documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Add health checks
builder.Services.AddHealthChecks();

// Add ProblemDetails support
builder.Services.AddProblemDetails();

// Distributed rate limiting backed by Redis. When a Redis connection string is
// present we share counters across every AI-wrapper replica; when it is absent
// (local dev without Redis) we fall back to the in-memory fixed-window
// limiter so developers don't need to run Redis just to call /chat.
var redisConnectionString = builder.Configuration["Redis:ConnectionString"];
IConnectionMultiplexer? redisConnection = null;
if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    redisConnection = ConnectionMultiplexer.Connect(redisConnectionString);
    builder.Services.AddSingleton(redisConnection);
}

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Named policy for /chat/ routes: per-IP fixed window. We resolve
    // PermitLimit at request time so WebApplicationFactory overrides during
    // integration tests still take effect.
    options.AddPolicy("chat", httpContext =>
    {
        var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
        var rateLimitPerMinute = config.GetValue("AiService:RateLimitPerMinute", 60);
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (redisConnection is not null)
        {
            return RedisRateLimitPartition.GetFixedWindowRateLimiter(
                partitionKey: clientIp,
                factory: key => new RedisFixedWindowRateLimiterOptions
                {
                    ConnectionMultiplexerFactory = () => redisConnection,
                    PermitLimit = rateLimitPerMinute,
                    Window = TimeSpan.FromMinutes(1),
                    RedisKey = $"sakina:ratelimit:aiwrapper:chat:{key}",
                });
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitPerMinute,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
        var clientIp = context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        logger.LogWarning("Rate limit exceeded for IP {ClientIp}", clientIp);

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Rate Limit Exceeded",
            Detail = "Too many requests. Please try again later.",
            Instance = context.HttpContext.Request.Path,
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? context.HttpContext.TraceIdentifier,
                ["retryAfter"] = "60"
            }
        };

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/problem+json";
        context.HttpContext.Response.Headers["Retry-After"] = "60";
        await context.HttpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
    };
});

// Register typed HttpClient for OpenAI service
builder.Services.AddHttpClient<IOpenAIChatService, OpenAIChatService>()
    .ConfigureHttpClient(client =>
    {
        // Default timeout is set in the service constructor
        client.DefaultRequestHeaders.Add("User-Agent", "AIWrapperService/1.0");
    });

// ===== Application Pipeline =====

var app = builder.Build();

// Enable Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "AI Wrapper Service v1");
        options.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

// Exception handling middleware
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exceptionHandlerFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var exception = exceptionHandlerFeature?.Error;

        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(exception, "Unhandled exception occurred");

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Internal Server Error",
            Detail = "An unexpected error occurred. Please try again later.",
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier
            }
        };

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problemDetails);
    });
});

// Security: Rate limiting (before API key check to prevent brute force)
app.UseRateLimiter();

// Security: API key authentication middleware
app.UseMiddleware<InternalApiKeyMiddleware>();

// Map health check endpoint (no authentication required)
app.MapHealthChecks("/health");

// Map chat API endpoints
app.MapChatApi();

app.Run();

// Make Program class accessible to integration tests
public partial class Program { }
