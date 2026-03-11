namespace JournalService.Api.Middleware;

using JournalService.Api.UserContext;

public class UserContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UserContextMiddleware> _logger;

    public UserContextMiddleware(
        RequestDelegate next,
        ILogger<UserContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    private static readonly string[] ExcludedPaths = ["/api/health", "/api/ping"];

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        if (ExcludedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var userIdHeader = context.Request.Headers["X-User-Id"].ToString();
        var emailHeader = context.Request.Headers["X-User-Email"].ToString();

        _logger.LogDebug("Received X-User-Id: {UserId}, X-User-Email: {Email}",
            userIdHeader, emailHeader);

        if (string.IsNullOrWhiteSpace(userIdHeader) || !Guid.TryParse(userIdHeader, out var userId))
        {
            _logger.LogWarning("Request missing valid X-User-Id header. UserIdHeader: {UserIdHeader}",
                userIdHeader);

            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                "{\"error\":\"Unauthorized\",\"message\":\"Missing or invalid user context from gateway\"}");
            return;
        }

        var authenticatedUser = new AuthenticatedUser
        {
            UserId = userId,
            Email = emailHeader ?? string.Empty
        };

        context.Items["AuthenticatedUser"] = authenticatedUser;

        _logger.LogInformation("Authenticated user {UserId} ({Email}) from gateway headers",
            userId, emailHeader);

        await _next(context);
    }
}
