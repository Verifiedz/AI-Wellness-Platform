namespace NotificationService.Api.Models.Entities;

/// <summary>
/// Represents user notification preferences from the database
/// </summary>
public class UserNotificationPreferences
{
    public Guid UserId { get; set; }
    public bool IsEnabled { get; set; }
    public TimeSpan PreferredTimeUtc { get; set; }
    public string Timezone { get; set; } = string.Empty;
    public string? DeviceToken { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}