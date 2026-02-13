namespace NotificationService.Api.Models.Responses;

/// <summary>
/// Response model for user notification preferences
/// </summary>
public class PreferencesResponse
{
    public Guid UserId { get; set; }
    public bool IsEnabled { get; set; }
    public string PreferredTimeUtc { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public string? DeviceToken { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}