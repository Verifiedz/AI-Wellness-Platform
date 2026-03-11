namespace JournalService.Api.Models.Entities;

public class JournalPrompt
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}
