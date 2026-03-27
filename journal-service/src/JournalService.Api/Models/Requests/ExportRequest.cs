namespace JournalService.Api.Models.Requests;

using System.ComponentModel.DataAnnotations;

public sealed record ExportRequest(
    [Required]
    DateOnly StartDate,

    [Required]
    DateOnly EndDate,

    [Required]
    [RegularExpression("^(pdf|csv)$", ErrorMessage = "Format must be pdf or csv")]
    string Format,

    bool IncludeAssessments = true,
    bool IncludeMoods = true,
    bool IncludeJournalSummaries = true
);
