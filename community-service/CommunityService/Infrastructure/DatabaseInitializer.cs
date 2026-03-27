namespace CommunityService.Infrastructure;

using Npgsql;

public class DatabaseInitializer
{
    private readonly string _connectionString;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(
        IConfiguration configuration,
        ILogger<DatabaseInitializer> logger)
    {
        _connectionString = configuration.GetConnectionString("CommunityDatabase")
            ?? throw new InvalidOperationException("CommunityDatabase connection string is not configured");
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        _logger.LogInformation("Starting community database initialization...");

        try
        {
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            _logger.LogInformation("Community database connection successful");

            var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            var dockerPath = Path.Combine(baseDirectory, "database");
            var devPath = Path.GetFullPath(Path.Combine(baseDirectory, "..", "..", "..", "..", "database"));
            var databasePath = Directory.Exists(dockerPath) ? dockerPath : devPath;

            _logger.LogInformation("Looking for database scripts in: {DatabasePath}", databasePath);

            if (!Directory.Exists(databasePath))
            {
                _logger.LogWarning("Database scripts directory not found. Skipping initialization.");
                return;
            }

            var schemaPath = Path.Combine(databasePath, "01_schema.sql");
            if (File.Exists(schemaPath))
            {
                var sql = await File.ReadAllTextAsync(schemaPath);
                await using var command = new NpgsqlCommand(sql, connection) { CommandTimeout = 120 };
                await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Schema script executed successfully");
            }

            _logger.LogInformation("Community database initialization completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Community database initialization failed");
            throw;
        }
    }
}
