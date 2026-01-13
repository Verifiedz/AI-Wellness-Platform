using System.Collections.Concurrent;

namespace AIWrapperService.Middleware;

/// Simple in-memory rate limiting middleware to protect upstream providers.
/// Limits requests per IP address to prevent abuse.
/// Production systems should use distributed rate limiting (Redis, etc.).
public class RateLimitingMiddleware : IDisposable
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly int _maxRequestsPerMinute;
    private readonly ConcurrentDictionary<string, RequestCounter> _requestCounts = new();
    private readonly Timer _cleanupTimer;
    private const int CleanupIntervalMinutes = 5;
    private const int StaleThresholdMinutes = 10;

    public RateLimitingMiddleware(
        RequestDelegate next,
        ILogger<RateLimitingMiddleware> logger,
        IConfiguration config)
    {
        _next = next;
        _logger = logger;
        _maxRequestsPerMinute = config.GetValue("AiService:RateLimitPerMinute", 60);

        // Clean up stale entries every 5 minutes to prevent memory leak
        _cleanupTimer = new Timer(
            CleanupStaleEntries,
            null,
            TimeSpan.FromMinutes(CleanupIntervalMinutes),
            TimeSpan.FromMinutes(CleanupIntervalMinutes));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Only rate limit /v1/** routes
        if (path.StartsWith("/v1/", StringComparison.OrdinalIgnoreCase))
        {
            var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var counter = _requestCounts.GetOrAdd(clientIp, _ => new RequestCounter());

            if (!counter.TryIncrementRequest(_maxRequestsPerMinute))
            {
                _logger.LogWarning("Rate limit exceeded for IP {ClientIp}", clientIp);
                await WriteProblemDetails(context, clientIp);
                return;
            }
        }

        await _next(context);
    }

    private static async Task WriteProblemDetails(HttpContext context, string clientIp)
    {
        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Rate Limit Exceeded",
            Detail = "Too many requests. Please try again later.",
            Instance = context.Request.Path,
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier,
                ["retryAfter"] = "60"
            }
        };

        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.Response.ContentType = "application/problem+json";
        context.Response.Headers["Retry-After"] = "60";
        await context.Response.WriteAsJsonAsync(problemDetails);
    }

    private void CleanupStaleEntries(object? state)
    {
        var staleKeys = _requestCounts
            .Where(kvp => kvp.Value.IsStale(StaleThresholdMinutes))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var key in staleKeys)
        {
            _requestCounts.TryRemove(key, out _);
        }

        if (staleKeys.Count > 0)
        {
            _logger.LogDebug("Cleaned up {Count} stale rate limit entries", staleKeys.Count);
        }
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
    }

    private class RequestCounter
    {
        private readonly object _lock = new();
        private int _count;
        private DateTime _windowStart = DateTime.UtcNow;
        private DateTime _lastAccess = DateTime.UtcNow;

        public bool TryIncrementRequest(int maxRequests)
        {
            lock (_lock)
            {
                var now = DateTime.UtcNow;
                _lastAccess = now;

                // Reset window if more than 1 minute has passed
                if ((now - _windowStart).TotalMinutes >= 1)
                {
                    _count = 0;
                    _windowStart = now;
                }

                if (_count >= maxRequests)
                {
                    return false;
                }

                _count++;
                return true;
            }
        }

        public bool IsStale(int staleThresholdMinutes)
        {
            lock (_lock)
            {
                return (DateTime.UtcNow - _lastAccess).TotalMinutes >= staleThresholdMinutes;
            }
        }
    }
}
