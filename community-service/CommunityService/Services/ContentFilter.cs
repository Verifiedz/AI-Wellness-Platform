namespace CommunityService.Services;

using System.Text.RegularExpressions;

/// <summary>
/// Lightweight content filter applied to every user-generated community post
/// before it reaches the database. The goal is to satisfy Apple App Store
/// Guideline 1.2 — "a method for filtering objectionable material" — by
/// blocking obvious slurs and PII signals prior to publication. The filter is
/// intentionally conservative: it only rejects posts with unambiguous
/// objectionable content, and otherwise passes them through (moderation of
/// edge cases is handled by the community reporting flow).
/// </summary>
public interface IContentFilter
{
    /// <summary>
    /// Validate a post body. Returns a reject reason when the text should be
    /// blocked, or <see langword="null"/> when the text is acceptable.
    /// </summary>
    string? Validate(string content);
}

public sealed class ContentFilter : IContentFilter
{
    // Kept small on purpose. This is a first-line defense, not a substitute for
    // human moderation via the report flow.
    private static readonly string[] BlockedTerms =
    [
        // racial/ethnic slurs (partial list — extend via configuration if needed)
        "nigger", "nigga", "chink", "spic", "kike", "gook", "tranny", "fag", "faggot",
        // self-harm encouragement phrases
        "kill yourself", "kys", "go die",
    ];

    // Match a full email address or a plausible E.164-style phone number. We
    // strip these so community members don't accidentally expose PII in posts
    // that are public to the rest of the support group.
    private static readonly Regex EmailRegex = new(
        @"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex PhoneRegex = new(
        @"(?<![0-9])\+?\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}(?![0-9])",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public string? Validate(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return "Post cannot be empty";
        }

        var normalized = content.ToLowerInvariant();
        foreach (var term in BlockedTerms)
        {
            if (normalized.Contains(term))
            {
                return "Your post contains language that isn't allowed in this community.";
            }
        }

        if (EmailRegex.IsMatch(content))
        {
            return "Please don't share email addresses publicly — remove it and try again.";
        }

        if (PhoneRegex.IsMatch(content))
        {
            return "Please don't share phone numbers publicly — remove it and try again.";
        }

        return null;
    }
}
