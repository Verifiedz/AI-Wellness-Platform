namespace NotificationService.Api.Models.Requests;

/// <summary>
/// Request payload sent from the authentication service when a verification code
/// (e.g. email verification, password reset) needs to be delivered to the user.
/// </summary>
public class SendCodeRequest
{
    /// <summary>
    /// The unique identifier of the user in the auth database.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// The email address the code should be delivered to.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// The verification code to deliver.
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Type of verification operation, e.g. 'email_verify', 'password_reset'.
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// UTC timestamp for when the code was generated.
    /// </summary>
    public DateTime Timestamp { get; set; }
}

