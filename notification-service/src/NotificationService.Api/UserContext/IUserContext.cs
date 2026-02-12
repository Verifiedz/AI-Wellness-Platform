namespace NotificationService.Api.UserContext;

/// <summary>
/// Service interface for accessing the current authenticated user context
/// This abstraction allows services and controllers to access user information
/// without directly depending on HttpContext
/// </summary>
public interface IUserContext
{
    /// <summary>
    /// Gets the currently authenticated user from the request context
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown when no authenticated user exists in context</exception>
    AuthenticatedUser CurrentUser { get; }
}