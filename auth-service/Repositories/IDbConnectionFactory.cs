using System.Data;

namespace AIWellness.Auth.Repositories;

public interface IDbConnectionFactory
{
  IDbConnection CreateConnection();
}