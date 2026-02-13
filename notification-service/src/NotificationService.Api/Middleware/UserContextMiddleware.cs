namespace NotificationService.Api.Middleware;

using NotificationService.Api.UserContext;

/// <summary>
/// Middleware that extracts authenticated user information from YARP gateway headers
/// This runs in PRODUCTION mode where requests come through the YARP gateway
/// YARP validates the JWT and adds X-User-Id and X-User-Email headers
/// </summary>
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

    public async Task InvokeAsync(HttpContext context)
    {
        // Extract user ID from YARP header
        var userIdHeader = context.Request.Headers["X-User-Id"].ToString();
        var emailHeader = context.Request.Headers["X-User-Email"].ToString();

        // Log the headers for debugging (remove in production if sensitive)
        _logger.LogDebug("Received X-User-Id: {UserId}, X-User-Email: {Email}", 
            userIdHeader, emailHeader);

        // Validate that user ID header exists and is a valid GUID
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

        // Create authenticated user object
        var authenticatedUser = new AuthenticatedUser
        {
            UserId = userId,
            Email = emailHeader ?? string.Empty
        };

        // Store in HttpContext.Items for this request
        context.Items["AuthenticatedUser"] = authenticatedUser;

        _logger.LogInformation("Authenticated user {UserId} ({Email}) from gateway headers", 
            userId, emailHeader);

        // Continue to next middleware
        await _next(context);
    }
}