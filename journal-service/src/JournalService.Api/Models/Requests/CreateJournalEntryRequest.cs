namespace JournalService.Api.Models.Requests;

using System.ComponentModel.DataAnnotations;

public class CreateJournalEntryRequest
{
    [Required]
    [RegularExpression("^(great|good|okay|low|tough)$", ErrorMessage = "Mood must be one of: great, good, okay, low, tough")]
    public string Mood { get; set; } = string.Empty;

    public string[] Emotions { get; set; } = [];

    [Required]
    [Range(1, 10, ErrorMessage = "Energy level must be between 1 and 10")]
    public int EnergyLevel { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Journal content cannot be empty")]
    public string Content { get; set; } = string.Empty;

    [Required]
    public DateOnly EntryDate { get; set; }
}
