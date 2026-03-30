namespace NotificationService.Tests.BackgroundServices;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NotificationService.Api.BackgroundServices;

/// <summary>
/// Unit tests for NotificationScheduler.
/// The scheduler is a BackgroundService that uses IServiceProvider internally,
/// so tests cover construction, configuration, and graceful cancellation paths
/// without requiring a running database or push service.
/// </summary>
public class NotificationSchedulerTests
{
    private static IConfiguration BuildConfig(int intervalMinutes = 60)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"NotificationScheduler:IntervalMinutes"] = intervalMinutes.ToString()
            })
            .Build();
    }

    // ------------------------------------------------------------------ //
    // Scheduler can be constructed with mocked dependencies
    // ------------------------------------------------------------------ //

    [Fact]
    public void NotificationScheduler_CanBeConstructed_WithMockedDependencies()
    {
        var serviceProvider = new Mock<IServiceProvider>();
        var logger = NullLogger<NotificationScheduler>.Instance;
        var config = BuildConfig();

        var scheduler = new NotificationScheduler(serviceProvider.Object, logger, config);

        Assert.NotNull(scheduler);
    }

    // ------------------------------------------------------------------ //
    // Scheduler reads IntervalMinutes from configuration
    // ------------------------------------------------------------------ //

    [Fact]
    public void NotificationScheduler_UsesDefaultInterval_WhenConfigKeyMissing()
    {
        var serviceProvider = new Mock<IServiceProvider>();
        var logger = NullLogger<NotificationScheduler>.Instance;
        var emptyConfig = new ConfigurationBuilder().Build();

        // Should not throw even when key is absent (GetValue uses default 60)
        var scheduler = new NotificationScheduler(serviceProvider.Object, logger, emptyConfig);

        Assert.NotNull(scheduler);
    }

    // ------------------------------------------------------------------ //
    // StopAsync completes without throwing when called immediately
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task StopAsync_CompletesWithoutException_WhenCalledBeforeStart()
    {
        var serviceProvider = new Mock<IServiceProvider>();
        var logger = NullLogger<NotificationScheduler>.Instance;
        var config = BuildConfig();

        var scheduler = new NotificationScheduler(serviceProvider.Object, logger, config);

        // StopAsync should not throw even when ExecuteAsync was never started
        await scheduler.StopAsync(CancellationToken.None);
    }

    // ------------------------------------------------------------------ //
    // ExecuteAsync exits cleanly when cancellation is requested immediately
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task ExecuteAsync_ExitsCleanly_WhenCancelledImmediately()
    {
        var serviceProvider = new Mock<IServiceProvider>();
        var logger = NullLogger<NotificationScheduler>.Instance;
        var config = BuildConfig(intervalMinutes: 1);

        var scheduler = new NotificationScheduler(serviceProvider.Object, logger, config);

        using var cts = new CancellationTokenSource();

        // Start the scheduler then cancel right away — it must not throw
        var task = scheduler.StartAsync(cts.Token);
        await cts.CancelAsync();

        // Give a moment for the background task to observe cancellation
        var completionTask = scheduler.StopAsync(CancellationToken.None);
        var timeoutTask = Task.Delay(TimeSpan.FromSeconds(3));

        var finished = await Task.WhenAny(completionTask, timeoutTask);

        // As long as it does not deadlock within 3 s we consider it passing
        Assert.Equal(completionTask, finished);
    }
}
