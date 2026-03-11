namespace JournalService.Api.Infrastructure;

using Npgsql;

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
        _connectionString = configuration.GetConnectionString("JournalDatabase")
            ?? throw new InvalidOperationException("JournalDatabase connection string is not configured");
        _logger = logger;
        _env = env;
    }

    public async Task InitializeAsync()
    {
        _logger.LogInformation("Starting database initialization...");

        try
        {
            await TestConnectionAsync();

            var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            var databasePath = Path.Combine(baseDirectory, "..", "..", "..", "..", "..", "database");
            databasePath = Path.GetFullPath(databasePath);

            _logger.LogInformation("Looking for database scripts in: {DatabasePath}", databasePath);

            if (!Directory.Exists(databasePath))
            {
                _logger.LogWarning("Database scripts directory not found at {DatabasePath}. Skipping initialization.",
                    databasePath);
                return;
            }

            await ExecuteScriptAsync(Path.Combine(databasePath, "01_schema.sql"), "Schema");
            await ExecuteScriptAsync(Path.Combine(databasePath, "02_stored_procedures.sql"), "Stored Procedures");
            await ExecuteScriptAsync(Path.Combine(databasePath, "03_seed.sql"), "Seed Data");
            await ExecuteScriptAsync(Path.Combine(databasePath, "04_indexes.sql"), "Indexes");

            _logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database initialization failed: {Message}", ex.Message);

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
