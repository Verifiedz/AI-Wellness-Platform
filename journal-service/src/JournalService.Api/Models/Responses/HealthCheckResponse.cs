namespace JournalService.Api.Models.Responses;

public class HealthCheckResponse
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Database { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
}
