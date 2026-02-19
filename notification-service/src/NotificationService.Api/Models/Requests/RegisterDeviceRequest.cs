using System.ComponentModel.DataAnnotations;

namespace NotificationService.Api.Models.Requests;

/// <summary>
/// Request model for registering a device token
/// </summary>
public class RegisterDeviceRequest
{
    [Required(ErrorMessage = "DeviceToken is required")]
    [MinLength(1, ErrorMessage = "DeviceToken cannot be empty")]
    [MaxLength(500, ErrorMessage = "DeviceToken cannot exceed 500 characters")]
    public string DeviceToken { get; set; } = string.Empty;
}