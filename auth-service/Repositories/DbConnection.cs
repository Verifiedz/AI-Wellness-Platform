// Repositories/DbConnection.cs
using System.Data;
using Npgsql;

namespace AIWellness.Auth.Repositories
{
  public static class DbConnection
  {
    public static IDbConnection GetConnection(IConfiguration configuration)
    {
      var connectionString = configuration.GetConnectionString("PostgreSQL");
      if (string.IsNullOrEmpty(connectionString))
      {
        throw new InvalidOperationException("PostgreSQL connection string is not configured.");
      }

      var connection = new NpgsqlConnection(connectionString);
      connection.Open();
      return connection;
    }
  }
}