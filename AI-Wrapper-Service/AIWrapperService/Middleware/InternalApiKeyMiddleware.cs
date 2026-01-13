using System.Security.Cryptography;
using System.Text;

namespace AIWrapperService.Middleware;

/// Middleware to enforce X-Internal-API-Key authentication for /v1/** routes.
/// Rejects requests with missing or invalid keys using RFC-7807 ProblemDetails.
public class InternalApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InternalApiKeyMiddleware> _logger;
    private readonly byte[] _expectedApiKeyBytes;
    private const string ApiKeyHeader = "X-Internal-API-Key";

    public InternalApiKeyMiddleware(
        RequestDelegate next,
        IConfiguration config,
        ILogger<InternalApiKeyMiddleware> logger)
    {
        _next = next;
        _logger = logger;

        // Read configuration once in constructor, not on every request
        var expectedKey = config["AiService:InternalApiKey"];
        if (string.IsNullOrWhiteSpace(expectedKey))
        {
            throw new InvalidOperationException("AiService:InternalApiKey is not configured");
        }

        _expectedApiKeyBytes = Encoding.UTF8.GetBytes(expectedKey);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Only enforce on /v1/** routes
        if (path.StartsWith("/v1/", StringComparison.OrdinalIgnoreCase))
        {
            if (!context.Request.Headers.TryGetValue(ApiKeyHeader, out var providedKey)
                || string.IsNullOrWhiteSpace(providedKey))
            {
                _logger.LogWarning("Missing {Header} header for path {Path}", ApiKeyHeader, path);
                await WriteProblemDetails(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "Authentication Required",
                    $"The {ApiKeyHeader} header is missing or empty");
                return;
            }

            // Use constant-time comparison to prevent timing attacks
            var providedKeyBytes = Encoding.UTF8.GetBytes(providedKey!);
            var isValid = CryptographicOperations.FixedTimeEquals(providedKeyBytes, _expectedApiKeyBytes);

            if (!isValid)
            {
                _logger.LogWarning("Invalid {Header} for path {Path}", ApiKeyHeader, path);
                await WriteProblemDetails(
                    context,
                    StatusCodes.Status401Unauthorized,
                    "Invalid Credentials",
                    $"The provided {ApiKeyHeader} is invalid");
                return;
            }
        }

        await _next(context);
    }

    private static async Task WriteProblemDetails(
        HttpContext context,
        int statusCode,
        string title,
        string detail)
    {
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier
            }
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
