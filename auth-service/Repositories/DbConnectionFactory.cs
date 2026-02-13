using System.Data;
using Npgsql;

namespace AIWellness.Auth.Repositories;

public class DbConnectionFactory : IDbConnectionFactory
{
  private readonly string _connectionString;

  public DbConnectionFactory(IConfiguration configuration)
  {
    _connectionString = configuration.GetConnectionString("PostgreSQL")
        ?? throw new InvalidOperationException("PostgreSQL connection string is not configured.");
  }

  public IDbConnection CreateConnection()
  {
    var connection = new NpgsqlConnection(_connectionString);
    connection.Open();
    return connection;
  }
}