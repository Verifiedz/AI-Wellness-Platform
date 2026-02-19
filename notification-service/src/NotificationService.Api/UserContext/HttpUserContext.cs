namespace NotificationService.Api.UserContext;

/// <summary>
/// Implementation of IUserContext that retrieves user information from HttpContext
/// This is scoped per HTTP request
/// </summary>
public class HttpUserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<HttpUserContext> _logger;

    public HttpUserContext(
        IHttpContextAccessor httpContextAccessor,
        ILogger<HttpUserContext> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current authenticated user from HttpContext.Items
    /// The user is placed there by UserContextMiddleware after extracting from headers
    /// </summary>
    public AuthenticatedUser CurrentUser
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            
            if (httpContext == null)
            {
                _logger.LogError("HttpContext is null when attempting to access CurrentUser");
                throw new InvalidOperationException("No HTTP context available");
            }

            var user = httpContext.Items["AuthenticatedUser"] as AuthenticatedUser;
            
            if (user == null)
            {
                _logger.LogError("No authenticated user found in HttpContext.Items");
                throw new InvalidOperationException("No authenticated user in context");
            }

            return user;
        }
    }
}