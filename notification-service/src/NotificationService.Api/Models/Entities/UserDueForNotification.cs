namespace NotificationService.Api.Models.Entities;

/// <summary>
/// Represents a user who is due to receive a notification
/// Returned by sp_get_users_due_for_notification stored procedure
/// </summary>
public class UserDueForNotification
{
    public Guid UserId { get; set; }
    public string DeviceToken { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public TimeSpan PreferredTimeUtc { get; set; }
}