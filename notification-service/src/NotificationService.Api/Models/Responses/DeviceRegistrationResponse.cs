namespace NotificationService.Api.Models.Responses;

/// <summary>
/// Response model for device token registration
/// </summary>
public class DeviceRegistrationResponse
{
    public Guid UserId { get; set; }
    public bool IsEnabled { get; set; }
    public string PreferredTimeUtc { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public string DeviceToken { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}