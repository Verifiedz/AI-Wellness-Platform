using System.Security.Cryptography;
using System.Text;

namespace AIWrapperService.Middleware;

/// Middleware to enforce X-Internal-API-Key authentication for /chat/** routes.
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

        // Skip authentication for non-protected routes
        if (!path.StartsWith("/chat/", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Validate API key header exists
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

        // Validate API key value (constant-time comparison to prevent timing attacks)
        var providedKeyBytes = Encoding.UTF8.GetBytes(providedKey!);
        if (!CryptographicOperations.FixedTimeEquals(providedKeyBytes, _expectedApiKeyBytes))
        {
            _logger.LogWarning("Invalid {Header} for path {Path}", ApiKeyHeader, path);
            await WriteProblemDetails(
                context,
                StatusCodes.Status401Unauthorized,
                "Invalid Credentials",
                $"The provided {ApiKeyHeader} is invalid");
            return;
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
