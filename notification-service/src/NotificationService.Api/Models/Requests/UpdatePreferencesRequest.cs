using System.ComponentModel.DataAnnotations;

namespace NotificationService.Api.Models.Requests;

/// <summary>
/// Request model for updating user notification preferences
/// </summary>
public class UpdatePreferencesRequest
{
    [Required(ErrorMessage = "IsEnabled is required")]
    public bool IsEnabled { get; set; }

    [Required(ErrorMessage = "PreferredTimeUtc is required")]
    [RegularExpression(@"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$", 
        ErrorMessage = "PreferredTimeUtc must be in format HH:mm:ss (e.g., 09:00:00)")]
    public string PreferredTimeUtc { get; set; } = string.Empty;

    [Required(ErrorMessage = "Timezone is required")]
    [MinLength(1, ErrorMessage = "Timezone cannot be empty")]
    [MaxLength(50, ErrorMessage = "Timezone cannot exceed 50 characters")]
    public string Timezone { get; set; } = string.Empty;
}