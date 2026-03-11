namespace JournalService.Api.Infrastructure;

using Npgsql;

public static class DataReaderExtensions
{
    public static string GetStringSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }

    public static string? GetStringNullable(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    public static Guid GetGuidSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetGuid(ordinal);
    }

    public static int GetInt32Safe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetInt32(ordinal);
    }

    public static long GetInt64Safe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetInt64(ordinal);
    }

    public static bool GetBooleanSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetBoolean(ordinal);
    }

    public static DateTime GetDateTimeSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.GetDateTime(ordinal);
    }

    public static DateTime? GetDateTimeNullable(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    public static decimal GetDecimalSafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? 0m : reader.GetDecimal(ordinal);
    }

    /// <summary>
    /// Read a PostgreSQL TEXT[] column into a C# string array.
    /// </summary>
    public static string[] GetStringArraySafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
            return [];

        var value = reader.GetFieldValue<string[]>(ordinal);
        return value ?? [];
    }

    /// <summary>
    /// Read a DATE column as DateOnly.
    /// </summary>
    public static DateOnly GetDateOnlySafe(this NpgsqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        var dt = reader.GetDateTime(ordinal);
        return DateOnly.FromDateTime(dt);
    }
}
