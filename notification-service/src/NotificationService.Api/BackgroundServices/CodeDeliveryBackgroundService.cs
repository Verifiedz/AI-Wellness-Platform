namespace NotificationService.Api.BackgroundServices;

using System.Diagnostics;
using NotificationService.Api.Services;

/// <summary>
/// Drains <see cref="CodeDeliveryQueue"/> and performs the real SMTP/SMS delivery
/// off the request thread. This keeps the /api/notifications/send-code endpoint
/// returning in milliseconds so the upstream login/register flow is not blocked
/// by slow SMTP handshakes.
///
/// Failures are logged but never rethrown — we must never tear down the worker
/// because a single bad delivery attempt failed.
/// </summary>
public sealed class CodeDeliveryBackgroundService : BackgroundService
{
    private readonly CodeDeliveryQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<CodeDeliveryBackgroundService> _logger;

    public CodeDeliveryBackgroundService(
        CodeDeliveryQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<CodeDeliveryBackgroundService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("CodeDeliveryBackgroundService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            CodeSendJob job;
            try
            {
                job = await _queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await ProcessJobSafelyAsync(job, stoppingToken);
        }

        _logger.LogInformation("CodeDeliveryBackgroundService stopping");
    }

    private async Task ProcessJobSafelyAsync(CodeSendJob job, CancellationToken stoppingToken)
    {
        var waitedMs = (DateTime.UtcNow - job.EnqueuedAtUtc).TotalMilliseconds;
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "CodeDeliveryBackgroundService dequeued job UserId={UserId}, Type={Type}, QueueWaitMs={QueueWaitMs}, CorrelationId={CorrelationId}",
            job.UserId, job.CodeType, waitedMs, job.CorrelationId);

        try
        {
            // CodeDeliveryService is registered via AddHttpClient => scoped.
            // We must create a scope per job to resolve it safely from a hosted service.
            using var scope = _scopeFactory.CreateScope();
            var delivery = scope.ServiceProvider.GetRequiredService<CodeDeliveryService>();

            var (emailSent, smsSent) = await delivery.SendAsync(
                job.Email,
                job.Phone,
                job.CodeType,
                job.Code,
                job.Channel);

            stopwatch.Stop();
            _logger.LogInformation(
                "CodeDeliveryBackgroundService completed job UserId={UserId}, Type={Type}, EmailSent={EmailSent}, SmsSent={SmsSent}, SendMs={SendMs}, CorrelationId={CorrelationId}",
                job.UserId, job.CodeType, emailSent, smsSent, stopwatch.ElapsedMilliseconds, job.CorrelationId);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            // Swallow — never let a single failed delivery kill the worker.
            _logger.LogError(
                ex,
                "CodeDeliveryBackgroundService failed job UserId={UserId}, Type={Type}, SendMs={SendMs}, CorrelationId={CorrelationId}",
                job.UserId, job.CodeType, stopwatch.ElapsedMilliseconds, job.CorrelationId);
        }
    }
}
