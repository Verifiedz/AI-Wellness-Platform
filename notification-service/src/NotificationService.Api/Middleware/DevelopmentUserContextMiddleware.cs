namespace NotificationService.Api.Middleware;

using NotificationService.Api.UserContext;

/// <summary>
/// Middleware for DEVELOPMENT mode that allows testing without YARP gateway
/// Extracts user ID from query string parameter or uses a default test user
/// WARNING: Only use in development! Never enable in production!
/// </summary>
public class DevelopmentUserContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DevelopmentUserContextMiddleware> _logger;

    // Default test user ID for development
    private static readonly Guid DefaultTestUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private const string DefaultTestEmail = "test@example.com";

    public DevelopmentUserContextMiddleware(
        RequestDelegate next,
        ILogger<DevelopmentUserContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        Guid userId;
        string email;

        // Try to get user ID from query string first (e.g., ?userId=xxx)
        var userIdQuery = context.Request.Query["userId"].ToString();

        if (!string.IsNullOrWhiteSpace(userIdQuery) && Guid.TryParse(userIdQuery, out var parsedUserId))
        {
            userId = parsedUserId;
            email = context.Request.Query["email"].ToString();
            
            if (string.IsNullOrWhiteSpace(email))
            {
                email = $"user-{userId}@example.com";
            }

            _logger.LogInformation("Development mode: Using userId from query string: {UserId}", userId);
        }
        else
        {
            // Use default test user
            userId = DefaultTestUserId;
            email = DefaultTestEmail;
            
            _logger.LogInformation("Development mode: Using default test user: {UserId}", userId);
        }

        // Create authenticated user object
        var authenticatedUser = new AuthenticatedUser
        {
            UserId = userId,
            Email = email
        };

        // Store in HttpContext.Items for this request
        context.Items["AuthenticatedUser"] = authenticatedUser;

        _logger.LogDebug("Development authenticated user: {UserId} ({Email})", userId, email);

        // Continue to next middleware
        await _next(context);
    }
}