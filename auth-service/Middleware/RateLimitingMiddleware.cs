using Microsoft.Extensions.Caching.Memory;

namespace AIWellness.Auth.Middleware;

public class RateLimitingMiddleware
{
  private readonly RequestDelegate _next;
  private readonly IMemoryCache _cache;
  private readonly ILogger<RateLimitingMiddleware> _logger;
  private readonly int _maxRequestsPerMinute;
  private readonly int _maxLoginAttemptsPerMinute;

  public RateLimitingMiddleware(
      RequestDelegate next,
      IMemoryCache cache,
      ILogger<RateLimitingMiddleware> logger,
      IConfiguration configuration)
  {
    _next = next;
    _cache = cache;
    _logger = logger;
    _maxRequestsPerMinute = configuration.GetValue<int>("RateLimiting:MaxRequestsPerMinute", 100);
    _maxLoginAttemptsPerMinute = configuration.GetValue<int>("RateLimiting:MaxLoginAttemptsPerMinute", 5);
  }

  public async Task InvokeAsync(HttpContext context)
  {
    var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var endpoint = context.Request.Path.ToString();

    var cacheKey = $"rate_limit_{ipAddress}_{endpoint}";
    var loginCacheKey = $"login_limit_{ipAddress}";

    var requestCount = _cache.GetOrCreate(cacheKey, entry =>
    {
      entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
      return 0;
    });

    if (requestCount >= _maxRequestsPerMinute)
    {
      _logger.LogWarning($"Rate limit exceeded for IP: {ipAddress}, Endpoint: {endpoint}");
      context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
      await context.Response.WriteAsync("Too many requests. Please try again later.");
      return;
    }

    _cache.Set(cacheKey, requestCount + 1, TimeSpan.FromMinutes(1));

    if (endpoint.Contains("/api/auth/login", StringComparison.OrdinalIgnoreCase))
    {
      var loginAttempts = _cache.GetOrCreate(loginCacheKey, entry =>
      {
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
        return 0;
      });

      if (loginAttempts >= _maxLoginAttemptsPerMinute)
      {
        _logger.LogWarning($"Login rate limit exceeded for IP: {ipAddress}");
        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.Response.WriteAsync("Too many login attempts. Please try again later.");
        return;
      }

      _cache.Set(loginCacheKey, loginAttempts + 1, TimeSpan.FromMinutes(1));
    }

    await _next(context);
  }
}

public static class RateLimitingMiddlewareExtensions
{
  public static IApplicationBuilder UseRateLimiting(this IApplicationBuilder builder)
  {
    return builder.UseMiddleware<RateLimitingMiddleware>();
  }
}