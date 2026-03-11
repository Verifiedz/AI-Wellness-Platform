namespace JournalService.Api.Middleware;

using JournalService.Api.UserContext;

public class DevelopmentUserContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DevelopmentUserContextMiddleware> _logger;

    private static readonly Guid DefaultTestUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private const string DEFAULT_TEST_EMAIL = "test@example.com";

    public DevelopmentUserContextMiddleware(
        RequestDelegate next,
        ILogger<DevelopmentUserContextMiddleware> logger)
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

        Guid userId;
        string email;

        var userIdQuery = context.Request.Query["userId"].ToString();

        if (!string.IsNullOrWhiteSpace(userIdQuery) && Guid.TryParse(userIdQuery, out var parsedUserId))
        {
            userId = parsedUserId;
            email = context.Request.Query["email"].ToString();

            if (string.IsNullOrWhiteSpace(email))
                email = $"user-{userId}@example.com";

            _logger.LogInformation("Development mode: Using userId from query string: {UserId}", userId);
        }
        else
        {
            userId = DefaultTestUserId;
            email = DEFAULT_TEST_EMAIL;

            _logger.LogInformation("Development mode: Using default test user: {UserId}", userId);
        }

        var authenticatedUser = new AuthenticatedUser
        {
            UserId = userId,
            Email = email
        };

        context.Items["AuthenticatedUser"] = authenticatedUser;

        _logger.LogDebug("Development authenticated user: {UserId} ({Email})", userId, email);

        await _next(context);
    }
}
