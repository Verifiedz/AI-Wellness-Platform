using System.ComponentModel.DataAnnotations;

namespace WellnessApp.NotificationService.Models
{
    public class NotificationLog
    {
        [Key]
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string TipContent { get; set; } = string.Empty;
        public int? TipId { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending";
        public string? ErrorMessage { get; set; }
    }
}
