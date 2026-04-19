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

            foreach (var (fileName, label) in new[]
            {
                ("01_schema.sql", "schema"),
                ("02_moderation.sql", "moderation"),
            })
            {
                var scriptPath = Path.Combine(databasePath, fileName);
                if (!File.Exists(scriptPath))
                {
                    _logger.LogWarning("Migration script {File} not found; skipping", fileName);
                    continue;
                }

                var sql = await File.ReadAllTextAsync(scriptPath);
                await using var command = new NpgsqlCommand(sql, connection) { CommandTimeout = 120 };
                await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Executed {Label} migration from {File}", label, fileName);
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
