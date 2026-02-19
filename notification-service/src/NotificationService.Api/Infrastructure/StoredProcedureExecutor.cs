namespace NotificationService.Api.Infrastructure;

using Npgsql;
using System.Data;

/// <summary>
/// Utility class for executing PostgreSQL stored procedures
/// Provides methods for scalar queries, reader queries, and non-query operations
/// </summary>
public class StoredProcedureExecutor
{
    private readonly string _connectionString;
    private readonly ILogger<StoredProcedureExecutor> _logger;

    public StoredProcedureExecutor(
        IConfiguration configuration,
        ILogger<StoredProcedureExecutor> logger)
    {
        _connectionString = configuration.GetConnectionString("NotificationDatabase")
            ?? throw new InvalidOperationException("NotificationDatabase connection string is not configured");
        _logger = logger;
    }

    /// <summary>
    /// Builds SQL to call a PostgreSQL function via SELECT (functions are not called with CALL).
    /// </summary>
    private static string BuildFunctionCallSql(string functionName, NpgsqlParameter[]? parameters, bool returnTable)
    {
        var paramList = parameters != null && parameters.Length > 0
            ? string.Join(", ", parameters.Select(p => "@" + p.ParameterName))
            : "";
        var invocation = $"{functionName}({paramList})";
        return returnTable ? $"SELECT * FROM {invocation}" : $"SELECT {invocation}";
    }

    /// <summary>
    /// Execute a stored procedure (PostgreSQL function) that returns a single scalar value
    /// </summary>
    /// <typeparam name="T">Type of the return value</typeparam>
    /// <param name="procedureName">Name of the function</param>
    /// <param name="parameters">Parameters for the function</param>
    /// <returns>The scalar result or default value if null</returns>
    public async Task<T?> ExecuteScalarAsync<T>(string procedureName, NpgsqlParameter[]? parameters = null)
    {
        try
        {
            _logger.LogDebug("Executing scalar procedure: {ProcedureName}", procedureName);

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = BuildFunctionCallSql(procedureName, parameters, returnTable: false);
            await using var command = new NpgsqlCommand(sql, connection)
            {
                CommandType = CommandType.Text
            };

            if (parameters != null && parameters.Length > 0)
            {
                command.Parameters.AddRange(parameters);
            }

            var result = await command.ExecuteScalarAsync();

            if (result == null || result == DBNull.Value)
            {
                _logger.LogDebug("Procedure {ProcedureName} returned null", procedureName);
                return default;
            }

            return (T)result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing scalar procedure {ProcedureName}", procedureName);
            throw;
        }
    }

    /// <summary>
    /// Execute a stored procedure that returns multiple rows
    /// </summary>
    /// <typeparam name="T">Type of objects to return</typeparam>
    /// <param name="procedureName">Name of the stored procedure</param>
    /// <param name="parameters">Parameters for the stored procedure</param>
    /// <param name="mapFunction">Function to map DataReader row to object</param>
    /// <returns>List of mapped objects</returns>
    public async Task<List<T>> ExecuteReaderAsync<T>(
        string procedureName,
        NpgsqlParameter[]? parameters,
        Func<NpgsqlDataReader, T> mapFunction)
    {
        try
        {
            _logger.LogDebug("Executing reader procedure: {ProcedureName}", procedureName);

            var results = new List<T>();

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = BuildFunctionCallSql(procedureName, parameters, returnTable: true);
            await using var command = new NpgsqlCommand(sql, connection)
            {
                CommandType = CommandType.Text
            };

            if (parameters != null && parameters.Length > 0)
            {
                command.Parameters.AddRange(parameters);
            }

            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                results.Add(mapFunction(reader));
            }

            _logger.LogDebug("Procedure {ProcedureName} returned {Count} rows", procedureName, results.Count);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing reader procedure {ProcedureName}", procedureName);
            throw;
        }
    }

    /// <summary>
    /// Execute a stored procedure that doesn't return results (INSERT, UPDATE, DELETE)
    /// </summary>
    /// <param name="procedureName">Name of the stored procedure</param>
    /// <param name="parameters">Parameters for the stored procedure</param>
    /// <returns>Number of rows affected</returns>
    public async Task<int> ExecuteNonQueryAsync(string procedureName, NpgsqlParameter[]? parameters = null)
    {
        try
        {
            _logger.LogDebug("Executing non-query procedure: {ProcedureName}", procedureName);

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = BuildFunctionCallSql(procedureName, parameters, returnTable: true);
            await using var command = new NpgsqlCommand(sql, connection)
            {
                CommandType = CommandType.Text
            };

            if (parameters != null && parameters.Length > 0)
            {
                command.Parameters.AddRange(parameters);
            }

            var rowsAffected = await command.ExecuteNonQueryAsync();

            _logger.LogDebug("Procedure {ProcedureName} affected {RowsAffected} rows", 
                procedureName, rowsAffected);
            
            return rowsAffected;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing non-query procedure {ProcedureName}", procedureName);
            throw;
        }
    }

    /// <summary>
    /// Execute a stored procedure that returns a single row
    /// </summary>
    /// <typeparam name="T">Type of object to return</typeparam>
    /// <param name="procedureName">Name of the stored procedure</param>
    /// <param name="parameters">Parameters for the stored procedure</param>
    /// <param name="mapFunction">Function to map DataReader row to object</param>
    /// <returns>Single mapped object or null if no results</returns>
    public async Task<T?> ExecuteSingleAsync<T>(
        string procedureName,
        NpgsqlParameter[]? parameters,
        Func<NpgsqlDataReader, T> mapFunction) where T : class
    {
        try
        {
            _logger.LogDebug("Executing single-row procedure: {ProcedureName}", procedureName);

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var sql = BuildFunctionCallSql(procedureName, parameters, returnTable: true);
            await using var command = new NpgsqlCommand(sql, connection)
            {
                CommandType = CommandType.Text
            };

            if (parameters != null && parameters.Length > 0)
            {
                command.Parameters.AddRange(parameters);
            }

            await using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var result = mapFunction(reader);
                _logger.LogDebug("Procedure {ProcedureName} returned a single row", procedureName);
                return result;
            }

            _logger.LogDebug("Procedure {ProcedureName} returned no rows", procedureName);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing single-row procedure {ProcedureName}", procedureName);
            throw;
        }
    }

    /// <summary>
    /// Test database connectivity
    /// </summary>
    /// <returns>True if connection successful</returns>
    public async Task<bool> TestConnectionAsync()
    {
        try
        {
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            
            await using var command = new NpgsqlCommand("SELECT 1", connection);
            var result = await command.ExecuteScalarAsync();
            
            _logger.LogInformation("Database connection test successful");
            return result != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection test failed");
            return false;
        }
    }
}