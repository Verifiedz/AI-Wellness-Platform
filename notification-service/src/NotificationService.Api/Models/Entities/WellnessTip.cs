namespace NotificationService.Api.Models.Entities;

/// <summary>
/// Represents a wellness tip from the database
/// </summary>
public class WellnessTip
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}