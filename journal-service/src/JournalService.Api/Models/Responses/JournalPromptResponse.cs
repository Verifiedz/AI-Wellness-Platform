namespace JournalService.Api.Models.Responses;

public class JournalPromptResponse
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
}
