namespace JournalService.Api.Models.Entities;

public class Assessment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string AssessmentType { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public string Severity { get; set; } = string.Empty;
    public string Responses { get; set; } = "[]";
    public DateTime CompletedAt { get; set; }
}
