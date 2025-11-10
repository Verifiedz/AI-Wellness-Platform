using Microsoft.EntityFrameworkCore;
using WellnessApp.NotificationService.Data;
using WellnessApp.NotificationService.Models;

namespace WellnessApp.NotificationService.Services
{
    public class NotificationJobService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NotificationJobService> _logger;

        public NotificationJobService(
            IServiceProvider serviceProvider,
            ILogger<NotificationJobService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public async Task SendDailyTipsAsync()
        {
            _logger.LogInformation("Starting daily tips job at {Time}", DateTime.UtcNow);

            try
            {
                // Create a scope to get scoped services
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
                var tipService = scope.ServiceProvider.GetRequiredService<WellnessTipService>();
                var firebaseService = scope.ServiceProvider.GetRequiredService<FirebaseService>();

                var currentUtcTime = DateTime.UtcNow;

                // Get all enabled users with FCM tokens
                var users = await context.NotificationPreferences
                    .Where(p => p.IsEnabled && p.FcmToken != null)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} users with notifications enabled", users.Count);

                int sentCount = 0;
                int skippedCount = 0;
                int failedCount = 0;

                foreach (var user in users)
                {
                    try
                    {
                        // Check if user should receive notification now
                        if (!await ShouldSendNotificationNowAsync(user, currentUtcTime, context))
                        {
                            skippedCount++;
                            continue;
                        }

                        // Get random wellness tip
                        var tip = await tipService.GetRandomTipAsync();

                        // Send notification
                        var success = await firebaseService.SendNotificationAsync(
                            user.FcmToken!,
                            "Your Daily Wellness Tip 🌟",
                            tip);

                        // Log the notification
                        var log = new NotificationLog
                        {
                            UserId = user.UserId,
                            TipContent = tip,
                            Status = success ? "sent" : "failed",
                            SentAt = DateTime.UtcNow,
                            ErrorMessage = success ? null : "Failed to send via Firebase"
                        };

                        context.NotificationLogs.Add(log);
                        await context.SaveChangesAsync();

                        if (success)
                        {
                            sentCount++;
                            _logger.LogInformation(
                                "Sent notification to user {UserId}",
                                user.UserId);
                        }
                        else
                        {
                            failedCount++;
                            _logger.LogWarning(
                                "Failed to send notification to user {UserId}",
                                user.UserId);
                        }

                        // Small delay to avoid overwhelming Firebase
                        await Task.Delay(100);
                    }
                    catch (Exception ex)
                    {
                        failedCount++;
                        _logger.LogError(ex,
                            "Error sending notification to user {UserId}",
                            user.UserId);
                    }
                }

                _logger.LogInformation(
                    "Daily tips job completed. Sent: {Sent}, Skipped: {Skipped}, Failed: {Failed}",
                    sentCount, skippedCount, failedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in daily tips job");
            }
        }

        private async Task<bool> ShouldSendNotificationNowAsync(
            NotificationPreference preference,
            DateTime currentUtc,
            NotificationDbContext context)
        {
            try
            {
                // Convert current UTC time to user's timezone
                var userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(preference.Timezone);
                var userLocalTime = TimeZoneInfo.ConvertTimeFromUtc(currentUtc, userTimeZone);

                // Check if current hour matches user's preferred time
                var preferredHour = preference.PreferredTime.Hours;
                var currentHour = userLocalTime.Hour;

                if (currentHour != preferredHour)
                {
                    return false; // Not the right time yet
                }

                // Check if we already sent a notification today (in user's timezone)
                var todayStart = userLocalTime.Date;
                var todayStartUtc = TimeZoneInfo.ConvertTimeToUtc(todayStart, userTimeZone);

                var alreadySentToday = await context.NotificationLogs
                    .AnyAsync(l =>
                        l.UserId == preference.UserId &&
                        l.Status == "sent" &&
                        l.SentAt >= todayStartUtc);

                return !alreadySentToday; // Send only if not sent today
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error checking if should send to user {UserId}",
                    preference.UserId);
                return false;
            }
        }
    }
}