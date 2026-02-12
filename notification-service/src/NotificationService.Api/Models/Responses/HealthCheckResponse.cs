namespace NotificationService.Api.Models.Responses;

/// <summary>
/// Response model for health check endpoint
/// </summary>
public class HealthCheckResponse
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Database { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
}