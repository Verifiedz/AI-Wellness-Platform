namespace NotificationService.Api.Models.Entities;

/// <summary>
/// Represents a notification delivery log entry
/// </summary>
public class NotificationLog
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public int TipId { get; set; }
    public DateTime SentAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public string? DeviceToken { get; set; }
}