namespace AuthService.Tests.Services;

using System.Text.RegularExpressions;

/// <summary>
/// Tests for StoredProcedureExecutor function name validation (REL-02).
/// Validates the regex pattern used in both notification-service and journal-service
/// StoredProcedureExecutor implementations to prevent SQL injection via function name.
/// </summary>
public class StoredProcedureValidationTests
{
    // Exact same regex used in both StoredProcedureExecutor implementations
    private static readonly Regex ValidIdentifier =
        new(@"^[a-zA-Z_][a-zA-Z0-9_]*\z", RegexOptions.Compiled);

    [Theory]
    [InlineData("sp_get_notifications")]
    [InlineData("sp_log_notification_attempt")]
    [InlineData("sp_check_notification_sent_today")]
    [InlineData("sp_acquire_notification_job_lock")]
    [InlineData("sp_release_notification_job_lock")]
    [InlineData("sp_create_assessment")]
    [InlineData("sp_get_assessments")]
    [InlineData("sp_get_latest_assessment")]
    [InlineData("sp_log_escalation")]
    [InlineData("sp_delete_journal_entry")]
    [InlineData("_leading_underscore")]
    [InlineData("CamelCaseName")]
    [InlineData("name123")]
    public void StoredProcedureNameValidation_AcceptsValidIdentifiers(string functionName)
    {
        Assert.True(ValidIdentifier.IsMatch(functionName),
            $"Valid function name '{functionName}' was rejected by the identifier regex");
    }

    [Theory]
    [InlineData("'; DROP TABLE users; --", "SQL injection with semicolon and comment")]
    [InlineData("name; DELETE FROM", "semicolon injection")]
    [InlineData("func()", "parentheses injection")]
    [InlineData("schema.func", "dot-qualified name (schema injection)")]
    [InlineData("name OR 1=1", "space injection")]
    [InlineData("name\t", "tab character")]
    [InlineData("name\n", "newline injection")]
    [InlineData("\"quoted\"", "double-quote injection")]
    [InlineData("name'", "single-quote injection")]
    [InlineData("name--comment", "SQL comment injection")]
    [InlineData("1startsWithDigit", "starts with digit")]
    [InlineData("", "empty string")]
    [InlineData(" ", "whitespace only")]
    [InlineData("name with spaces", "spaces in name")]
    [InlineData("func$name", "dollar sign")]
    [InlineData("name@host", "at sign")]
    public void StoredProcedureNameValidation_RejectsInvalidIdentifiers(string functionName, string reason)
    {
        Assert.False(ValidIdentifier.IsMatch(functionName),
            $"Invalid function name '{functionName}' ({reason}) was accepted by the identifier regex");
    }

    [Fact]
    public void StoredProcedureNameValidation_NullThrowsOnRegexMatch()
    {
        // Regex.IsMatch throws ArgumentNullException on null input
        Assert.Throws<ArgumentNullException>(() => ValidIdentifier.IsMatch(null!));
    }
}
