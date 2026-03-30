using System.Security.Cryptography;
using System.Text;

namespace CommunityService.Middleware;

public sealed class GatewayAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GatewayAuthMiddleware> _logger;
    private readonly byte[] _expectedKeyBytes;
    private const string ApiKeyHeader = "X-Internal-Api-Key";

    public GatewayAuthMiddleware(
        RequestDelegate next,
        IConfiguration config,
        ILogger<GatewayAuthMiddleware> logger)
    {
        _next = next;
        _logger = logger;

        var key = config["Gateway:SharedSecret"];
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("Gateway:SharedSecret is not configured");

        _expectedKeyBytes = Encoding.UTF8.GetBytes(key);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/health"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var provided)
            || string.IsNullOrWhiteSpace(provided))
        {
            _logger.LogWarning("Missing {Header} on {Path}", ApiKeyHeader, context.Request.Path);
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"error\":\"GATEWAY_AUTH_REQUIRED\",\"message\":\"Gateway authentication required\"}");
            return;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided.ToString());
        if (!CryptographicOperations.FixedTimeEquals(providedBytes, _expectedKeyBytes))
        {
            _logger.LogWarning("Invalid {Header} for {Path}", ApiKeyHeader, context.Request.Path);
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"error\":\"GATEWAY_AUTH_INVALID\",\"message\":\"Gateway authentication failed\"}");
            return;
        }

        await _next(context);
    }
}
