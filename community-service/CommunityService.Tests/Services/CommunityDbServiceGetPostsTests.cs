namespace CommunityService.Tests.Services;

using System.Reflection;
using CommunityService.Services;
using Xunit;

/// <summary>
/// Tests that verify the N+1 query elimination in CommunityDbService.GetPostsAsync.
/// These are static-analysis tests — they inspect the SQL constant and the class
/// structure without requiring a live database.
/// </summary>
public class CommunityDbServiceGetPostsTests
{
    private const string GetPostsSqlFieldName = "GetPostsSql";

    private static string GetSqlConstant()
    {
        // The consolidated SQL is stored as a private const or static readonly field
        // named GetPostsSql on CommunityDbService.
        var field = typeof(CommunityDbService).GetField(
            GetPostsSqlFieldName,
            BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(field);
        var value = field.GetValue(null) as string;
        Assert.NotNull(value);
        return value!;
    }

    [Fact]
    public void GetPostsAsync_SqlConstant_ContainsJsonAggregation()
    {
        var sql = GetSqlConstant();

        // Proves that reaction counts are computed inside PostgreSQL via aggregation,
        // not fetched raw and grouped in application code.
        Assert.True(
            sql.Contains("json_object_agg", StringComparison.OrdinalIgnoreCase) ||
            sql.Contains("json_agg", StringComparison.OrdinalIgnoreCase),
            "GetPostsAsync SQL must use json_object_agg or json_agg to aggregate reactions in-query.");
    }

    [Fact]
    public void GetPostsAsync_SqlConstant_IsSingleStatement()
    {
        var sql = GetSqlConstant();

        // A single statement contains no semicolons (Npgsql executes them as one command).
        // Multiple statements separated by semicolons would indicate the old 3-query pattern
        // was still embedded in a multi-statement batch.
        var trimmed = sql.Trim().TrimEnd(';');
        Assert.False(
            trimmed.Contains(';'),
            "GetPostsAsync SQL must be a single statement with no embedded semicolons.");
    }

    [Fact]
    public void GetReactionCountsAsync_PrivateHelperMethod_DoesNotExist()
    {
        var method = typeof(CommunityDbService).GetMethod(
            "GetReactionCountsAsync",
            BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance);

        Assert.Null(method);
    }

    [Fact]
    public void GetUserReactionsAsync_PrivateHelperMethod_DoesNotExist()
    {
        var method = typeof(CommunityDbService).GetMethod(
            "GetUserReactionsAsync",
            BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance);

        Assert.Null(method);
    }
}
