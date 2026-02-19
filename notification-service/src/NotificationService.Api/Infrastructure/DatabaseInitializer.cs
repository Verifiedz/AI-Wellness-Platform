namespace NotificationService.Api.Infrastructure;

using Npgsql;

/// <summary>
/// Service that initializes the database by executing SQL scripts on application startup
/// Runs the schema, stored procedures, seed data, and index scripts
/// </summary>
public class DatabaseInitializer
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseInitializer> _logger;
    private readonly IHostEnvironment _env;

    public DatabaseInitializer(
        IConfiguration configuration,
        ILogger<DatabaseInitializer> logger,
        IHostEnvironment env)
    {
        _connectionString = configuration.GetConnectionString("NotificationDatabase")
            ?? throw new InvalidOperationException("NotificationDatabase connection string is not configured");
        _logger = logger;
        _env = env;
    }

    /// <summary>
    /// Initialize the database by running all SQL scripts
    /// </summary>
    public async Task InitializeAsync()
    {
        _logger.LogInformation("Starting database initialization...");

        try
        {
            // Test connection first
            await TestConnectionAsync();

            // Get the base directory (where the executable is running)
            var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            
            // Navigate up to find the database folder
            // In development: bin/Debug/net9.0 -> go up to project root
            var databasePath = Path.Combine(baseDirectory, "..", "..", "..", "..", "..", "database");
            
            // Normalize the path
            databasePath = Path.GetFullPath(databasePath);

            _logger.LogInformation("Looking for database scripts in: {DatabasePath}", databasePath);

            if (!Directory.Exists(databasePath))
            {
                _logger.LogWarning("Database scripts directory not found at {DatabasePath}. Skipping initialization.", 
                    databasePath);
                return;
            }

            // Execute scripts in order
            await ExecuteScriptAsync(Path.Combine(databasePath, "01_schema.sql"), "Schema");
            await ExecuteScriptAsync(Path.Combine(databasePath, "02_stored_procedures.sql"), "Stored Procedures");
            await ExecuteScriptAsync(Path.Combine(databasePath, "03_seed.sql"), "Seed Data");
            await ExecuteScriptAsync(Path.Combine(databasePath, "04_indexes.sql"), "Indexes");

            _logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database initialization failed: {Message}", ex.Message);
            
            // In production, we might want to fail fast if database init fails
            if (!_env.IsDevelopment())
            {
                throw;
            }
        }
    }

    private async Task TestConnectionAsync()
    {
        try
        {
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            _logger.LogInformation("Database connection successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to database");
            throw new InvalidOperationException("Cannot connect to database. Please check your connection string.", ex);
        }
    }

    private async Task ExecuteScriptAsync(string scriptPath, string scriptName)
    {
        if (!File.Exists(scriptPath))
        {
            _logger.LogWarning("Script file not found: {ScriptPath}. Skipping {ScriptName}.", 
                scriptPath, scriptName);
            return;
        }

        try
        {
            _logger.LogInformation("Executing {ScriptName} script: {ScriptPath}", scriptName, scriptPath);

            var sql = await File.ReadAllTextAsync(scriptPath);

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            await using var command = new NpgsqlCommand(sql, connection);
            
            // Set a longer timeout for scripts (especially seed data)
            command.CommandTimeout = 120;
            
            await command.ExecuteNonQueryAsync();

            _logger.LogInformation("{ScriptName} script executed successfully", scriptName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing {ScriptName} script: {Message}", scriptName, ex.Message);
            throw;
        }
    }
}