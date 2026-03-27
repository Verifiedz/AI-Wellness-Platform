namespace JournalService.Api.Models.Requests;

using System.ComponentModel.DataAnnotations;

public sealed record SubmitAssessmentRequest(
    [Required]
    [RegularExpression("^(PHQ9|GAD7)$", ErrorMessage = "Assessment type must be PHQ9 or GAD7")]
    string AssessmentType,

    [Required]
    AssessmentResponseItem[] Responses
);

public sealed record AssessmentResponseItem(
    [Required]
    int QuestionIndex,

    [Required]
    [Range(0, 3, ErrorMessage = "Score must be between 0 and 3")]
    int Score
);
