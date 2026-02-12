namespace NotificationService.Api.BackgroundServices;

using NotificationService.Api.Services;

/// <summary>
/// Background service that runs periodically to send daily wellness tips
/// Uses PostgreSQL advisory locks to prevent duplicate execution across multiple instances
/// </summary>
public class NotificationScheduler : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationScheduler> _logger;
    private readonly IConfiguration _configuration;
    private readonly int _intervalMinutes;

    public NotificationScheduler(
        IServiceProvider serviceProvider,
        ILogger<NotificationScheduler> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
        _intervalMinutes = _configuration.GetValue<int>("NotificationScheduler:IntervalMinutes", 60);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationScheduler started. Running every {Interval} minutes.", _intervalMinutes);

        // Wait a bit before first execution to allow app to fully start
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        // Use PeriodicTimer for periodic execution
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(_intervalMinutes));

        try
        {
            // Run immediately on startup, then periodically
            await ProcessNotificationsAsync(stoppingToken);

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessNotificationsAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("NotificationScheduler is stopping.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Critical error in NotificationScheduler: {Message}", ex.Message);
        }
    }

    private async Task ProcessNotificationsAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationScheduler: Starting notification processing cycle at {Time}", 
            DateTime.UtcNow);

        // Create a new scope for this processing cycle
        using var scope = _serviceProvider.CreateScope();
        
        var databaseService = scope.ServiceProvider.GetRequiredService<DatabaseService>();
        var wellnessTipService = scope.ServiceProvider.GetRequiredService<WellnessTipService>();
        var expoPushService = scope.ServiceProvider.GetRequiredService<ExpoPushService>();

        bool lockAcquired = false;

        try
        {
            // Step 1: Try to acquire the distributed lock
            lockAcquired = await databaseService.AcquireNotificationJobLockAsync();

            if (!lockAcquired)
            {
                _logger.LogInformation("NotificationScheduler: Lock already held by another instance. Skipping this cycle.");
                return;
            }

            _logger.LogInformation("NotificationScheduler: Lock acquired. Processing notifications...");

            // Step 2: Get current hour in UTC
            var currentHour = DateTime.UtcNow.Hour;
            _logger.LogDebug("Current UTC hour: {Hour}", currentHour);

            // Step 3: Get users due for notification at this hour
            var usersDue = await databaseService.GetUsersDueForNotificationAsync(currentHour);
            
            _logger.LogInformation("NotificationScheduler: Found {Count} users due for notification at hour {Hour}", 
                usersDue.Count, currentHour);

            if (usersDue.Count == 0)
            {
                _logger.LogInformation("NotificationScheduler: No users due for notification at this time.");
                return;
            }

            // Step 4: Process each user
            int successCount = 0;
            int failureCount = 0;

            foreach (var user in usersDue)
            {
                if (stoppingToken.IsCancellationRequested)
                {
                    _logger.LogWarning("NotificationScheduler: Cancellation requested. Stopping processing.");
                    break;
                }

                try
                {
                    bool sent = await ProcessUserNotificationAsync(
                        user.UserId,
                        user.DeviceToken,
                        wellnessTipService,
                        expoPushService,
                        databaseService);

                    if (sent)
                        successCount++;
                    else
                        failureCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing notification for user {UserId}: {Message}", 
                        user.UserId, ex.Message);
                    failureCount++;
                }

                // Small delay between users to avoid overwhelming the push API
                await Task.Delay(TimeSpan.FromMilliseconds(100), stoppingToken);
            }

            _logger.LogInformation(
                "NotificationScheduler: Processing complete. Success: {Success}, Failed: {Failed}, Total: {Total}",
                successCount, failureCount, usersDue.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in notification processing cycle: {Message}", ex.Message);
        }
        finally
        {
            // Step 5: Always release the lock in finally block
            if (lockAcquired)
            {
                try
                {
                    await databaseService.ReleaseNotificationJobLockAsync();
                    _logger.LogInformation("NotificationScheduler: Lock released.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error releasing lock: {Message}", ex.Message);
                }
            }
        }
    }

    /// <summary>
    /// Process a single user's notification. Returns true if sent successfully.
    /// </summary>
    private async Task<bool> ProcessUserNotificationAsync(
        Guid userId,
        string deviceToken,
        WellnessTipService wellnessTipService,
        ExpoPushService expoPushService,
        DatabaseService databaseService)
    {
        _logger.LogDebug("Processing notification for user {UserId}", userId);

        // Step 1: Get a random wellness tip for this user
        var tip = await wellnessTipService.GetRandomTipForUserAsync(userId);

        if (tip == null)
        {
            _logger.LogWarning("No wellness tip available for user {UserId}. Skipping.", userId);
            await databaseService.LogNotificationAttemptAsync(
                userId,
                0,
                "failed",
                "No wellness tip available",
                deviceToken);
            return false;
        }

        _logger.LogInformation("Selected tip {TipId} ({Category}) for user {UserId}", 
            tip.Id, tip.Category, userId);

        // Step 2: Send the notification via Expo Push API
        // ExpoPushService.SendNotificationWithRetryAsync already handles retries internally,
        // so we call it once here to avoid duplicate notifications.
        var notificationData = new Dictionary<string, string>
        {
            { "tipId", tip.Id.ToString() },
            { "category", tip.Category }
        };

        bool sent = await expoPushService.SendNotificationWithRetryAsync(
            deviceToken,
            "Your Daily Wellness Tip",
            tip.Content,
            notificationData);

        if (sent)
        {
            // Log successful send
            await databaseService.LogNotificationAttemptAsync(
                userId,
                tip.Id,
                "sent",
                null,
                deviceToken);

            _logger.LogInformation("Successfully sent notification to user {UserId} with tip {TipId}", 
                userId, tip.Id);
            return true;
        }

        // Log failure
        await databaseService.LogNotificationAttemptAsync(
            userId,
            tip.Id,
            "failed",
            "Expo Push service failed after retries",
            deviceToken);

        _logger.LogWarning("Failed to send notification to user {UserId} after all retries", userId);
        return false;
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationScheduler is stopping...");
        await base.StopAsync(stoppingToken);
    }
}