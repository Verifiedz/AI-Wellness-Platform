namespace JournalService.Api.Models.Responses;

public class JournalEntryResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Mood { get; set; } = string.Empty;
    public string[] Emotions { get; set; } = [];
    public int EnergyLevel { get; set; }
    public string Content { get; set; } = string.Empty;
    public string EntryDate { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
