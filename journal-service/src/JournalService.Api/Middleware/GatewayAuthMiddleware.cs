namespace JournalService.Api.Middleware;

using System.Security.Cryptography;
using System.Text;

/// <summary>
/// Service-to-service authentication middleware. Enforces that requests to
/// <c>/internal/*</c> carry the <c>X-Internal-Api-Key</c> header matching the
/// configured <c>Gateway:SharedSecret</c>. Used by the auth-service to cascade
/// user-data deletion without invoking the user-facing YARP path.
/// </summary>
public sealed class GatewayAuthMiddleware
{
    private const string ApiKeyHeader = "X-Internal-Api-Key";
    private readonly RequestDelegate _next;
    private readonly ILogger<GatewayAuthMiddleware> _logger;
    private readonly byte[] _expectedKeyBytes;

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
        // Only guard /internal routes — all other paths fall through to the user-context middleware.
        if (!context.Request.Path.StartsWithSegments("/internal"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var provided)
            || string.IsNullOrWhiteSpace(provided))
        {
            _logger.LogWarning("Missing {Header} on internal path {Path}", ApiKeyHeader, context.Request.Path);
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"error\":\"GATEWAY_AUTH_REQUIRED\",\"message\":\"Internal gateway authentication required\"}");
            return;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided.ToString());
        if (!CryptographicOperations.FixedTimeEquals(providedBytes, _expectedKeyBytes))
        {
            _logger.LogWarning("Invalid {Header} on internal path {Path}", ApiKeyHeader, context.Request.Path);
            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"error\":\"GATEWAY_AUTH_INVALID\",\"message\":\"Internal gateway authentication failed\"}");
            return;
        }

        await _next(context);
    }
}
