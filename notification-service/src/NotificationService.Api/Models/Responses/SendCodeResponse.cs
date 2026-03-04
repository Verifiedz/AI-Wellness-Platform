namespace NotificationService.Api.Models.Responses;

/// <summary>
/// Response model for the send-code endpoint
/// </summary>
public class SendCodeResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
