namespace JournalService.Api.Models.Responses;

public class MoodSummaryResponse
{
    public int TotalEntries { get; set; }
    public List<MoodCount> MoodCounts { get; set; } = [];
    public string? MostCommonMood { get; set; }
    public decimal AverageEnergy { get; set; }
}

public class MoodCount
{
    public string Mood { get; set; } = string.Empty;
    public long Count { get; set; }
    public decimal AverageEnergy { get; set; }
}
