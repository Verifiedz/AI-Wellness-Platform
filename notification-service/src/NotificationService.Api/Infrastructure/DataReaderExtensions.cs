namespace NotificationService.Api.Infrastructure;

using Npgsql;
using System.Data;

/// <summary>
/// Extension methods for NpgsqlDataReader to safely read values
/// Provides null-safe methods for reading different data types
/// </summary>
public static class DataReaderExtensions
{
    /// <summary>
    /// Safely get a string value, returning empty string if null
    /// </summary>
    public static string GetStringSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }

    /// <summary>
    /// Safely get a nullable string value
    /// </summary>
    public static string? GetStringNullable(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    /// <summary>
    /// Safely get a Guid value
    /// </summary>
    public static Guid GetGuidSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetGuid(ordinal);
    }

    /// <summary>
    /// Safely get a nullable Guid value
    /// </summary>
    public static Guid? GetGuidNullable(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetGuid(ordinal);
    }

    /// <summary>
    /// Safely get an int value
    /// </summary>
    public static int GetInt32Safe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetInt32(ordinal);
    }

    /// <summary>
    /// Safely get a long value
    /// </summary>
    public static long GetInt64Safe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetInt64(ordinal);
    }

    /// <summary>
    /// Safely get a boolean value
    /// </summary>
    public static bool GetBooleanSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetBoolean(ordinal);
    }

    /// <summary>
    /// Safely get a DateTime value
    /// </summary>
    public static DateTime GetDateTimeSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetDateTime(ordinal);
    }

    /// <summary>
    /// Safely get a TimeSpan value
    /// </summary>
    public static TimeSpan GetTimeSpanSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetTimeSpan(ordinal);
    }

    /// <summary>
    /// Safely get a nullable DateTime value
    /// </summary>
    public static DateTime? GetDateTimeNullable(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    /// <summary>
    /// Check if a column exists in the reader
    /// </summary>
    public static bool HasColumn(this NpgsqlDataReader reader, string columnName)
    {
        try
        {
            reader.GetOrdinal(columnName);
            return true;
        }
        catch (IndexOutOfRangeException)
        {
            return false;
        }
    }
}