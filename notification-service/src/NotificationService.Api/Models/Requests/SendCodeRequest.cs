using System.ComponentModel.DataAnnotations;

namespace NotificationService.Api.Models.Requests;

/// <summary>
/// Request model for sending a verification/2FA code via the notification service.
/// Called service-to-service by the Auth Service.
/// </summary>
public class SendCodeRequest
{
    [Required(ErrorMessage = "UserId is required")]
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Code is required")]
    [MinLength(1, ErrorMessage = "Code cannot be empty")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Type is required")]
    [RegularExpression("^(email_verify|2fa|password_reset)$",
        ErrorMessage = "Type must be one of: email_verify, 2fa, password_reset")]
    public string Type { get; set; } = string.Empty;
}
