namespace WellnessApp.NotificationService.Models
{
    public class WellnessTip
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
