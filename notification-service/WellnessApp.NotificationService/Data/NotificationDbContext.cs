using Microsoft.EntityFrameworkCore;
using WellnessApp.NotificationService.Models;

namespace WellnessApp.NotificationService.Data
{
    public class NotificationDbContext : DbContext
    {
        public NotificationDbContext(DbContextOptions<NotificationDbContext> options)
            : base(options) { }

        public DbSet<NotificationPreference> NotificationPreferences { get; set; }
        public DbSet<NotificationLog> NotificationLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<NotificationLog>().HasIndex(n => new { n.UserId, n.SentAt });
        }
    }
}
