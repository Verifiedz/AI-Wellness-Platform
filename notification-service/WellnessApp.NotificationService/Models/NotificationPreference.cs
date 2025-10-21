using System;
using System.ComponentModel.DataAnnotations;

namespace WellnessApp.NotificationService.Models
{
    public class NotificationPreference
    {
        [Key]
        public Guid UserId { get; set; }

        public bool IsEnabled { get; set; } = true;

        public TimeSpan PreferredTime { get; set; } = new TimeSpan(9,0,0); // Default to 9:00 AM

        public string Timezone { get; set; } = "UTC"; // Default to UTC

        public string? FcmToken { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
