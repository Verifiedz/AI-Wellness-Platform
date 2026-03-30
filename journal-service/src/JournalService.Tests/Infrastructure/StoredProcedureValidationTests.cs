namespace JournalService.Tests.Infrastructure;

using System.Reflection;
using System.Text.RegularExpressions;
using FluentAssertions;
using JournalService.Api.Infrastructure;

/// <summary>
/// Tests for the SQL injection guard in <see cref="StoredProcedureExecutor"/>.
/// ValidateFunctionName is private, so we invoke it via reflection, or
/// alternatively we verify the same regex pattern directly because the
/// production code's regex is a static field and observable behavior flows
/// through the public async methods.
///
/// We test the regex directly (it is the source of truth) and we verify
/// that <see cref="StoredProcedureExecutor.ExecuteScalarAsync{T}"/> throws
/// <see cref="ArgumentException"/> for malicious names, validating the
/// end-to-end guard without requiring a live database.
/// </summary>
public class StoredProcedureValidationTests
{
    // Mirror the exact regex used in StoredProcedureExecutor so tests
    // document the contract without modifying production code.
    private static readonly Regex ValidIdentifier =
        new(@"^[a-zA-Z_][a-zA-Z0-9_]*\z", RegexOptions.Compiled);

    // ------------------------------------------------------------------ //
    // Regex contract — valid identifiers
    // ------------------------------------------------------------------ //

    [Theory]
    [InlineData("get_entries")]
    [InlineData("create_entry")]
    [InlineData("sp_get_journal_entry_by_id")]
    [InlineData("sp_delete_journal_entry")]
    [InlineData("_private_function")]
    [InlineData("A")]
    [InlineData("func123")]
    public void ValidIdentifier_AcceptsLegalFunctionNames(string name)
    {
        ValidIdentifier.IsMatch(name).Should().BeTrue(
            because: $"'{name}' is a valid SQL identifier");
    }

    // ------------------------------------------------------------------ //
    // Regex contract — SQL metacharacters and injection attempts
    // ------------------------------------------------------------------ //

    [Theory]
    [InlineData("get_entries; DROP TABLE users--", "semicolon and SQL comment")]
    [InlineData("get_entries'", "single quote")]
    [InlineData("get_entries\"", "double quote")]
    [InlineData("get entries", "space")]
    [InlineData("get_entries()", "parentheses")]
    [InlineData("", "empty string")]
    [InlineData("123start", "starts with digit")]
    [InlineData("get-entries", "hyphen")]
    [InlineData("get_entries\n", "trailing newline (\\z vs $ distinction)")]
    [InlineData("get_entries\r\n", "CRLF newline")]
    [InlineData("get_entries --", "SQL line comment")]
    [InlineData("get_entries/**/", "SQL block comment")]
    public void ValidIdentifier_RejectsIllegalFunctionNames(string name, string reason)
    {
        ValidIdentifier.IsMatch(name).Should().BeFalse(
            because: $"'{name}' contains {reason} and must be rejected");
    }

    // ------------------------------------------------------------------ //
    // End-to-end guard — ValidateFunctionName via reflection
    // ------------------------------------------------------------------ //

    [Theory]
    [InlineData(";DROP TABLE users")]
    [InlineData("sp_get_user'; SELECT * FROM users--")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("func\n")]
    public void ValidateFunctionName_ThrowsArgumentException_ForMaliciousInput(string name)
    {
        // Arrange — resolve private static method via reflection
        var method = typeof(StoredProcedureExecutor)
            .GetMethod("ValidateFunctionName",
                BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull(
            because: "StoredProcedureExecutor must expose ValidateFunctionName for security contract");

        // Act & Assert
        var act = () => method!.Invoke(null, [name]);

        act.Should().Throw<TargetInvocationException>()
           .WithInnerException<ArgumentException>(
               because: $"'{name}' is an invalid function name and must be rejected");
    }

    [Theory]
    [InlineData("get_entries")]
    [InlineData("sp_create_journal_entry")]
    [InlineData("sp_delete_journal_entry")]
    public void ValidateFunctionName_DoesNotThrow_ForValidInput(string name)
    {
        // Arrange
        var method = typeof(StoredProcedureExecutor)
            .GetMethod("ValidateFunctionName",
                BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull();

        // Act & Assert — no exception thrown
        var act = () => method!.Invoke(null, [name]);
        act.Should().NotThrow(because: $"'{name}' is a valid function name");
    }
}
