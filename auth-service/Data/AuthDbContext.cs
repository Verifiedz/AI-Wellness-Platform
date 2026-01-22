using AIWellness.Auth.Models;
using Microsoft.EntityFrameworkCore;

namespace AIWellness.Auth.Data
{
  public class AuthDbContext : DbContext
  {
    public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options) { }
    public DbSet<User> Users { get; set; }
  }
}