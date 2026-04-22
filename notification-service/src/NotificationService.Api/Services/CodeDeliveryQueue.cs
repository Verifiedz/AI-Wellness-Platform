namespace NotificationService.Api.Services;

using System.Threading.Channels;

/// <summary>
/// Immutable job describing a single verification-code delivery attempt.
/// </summary>
public sealed record CodeSendJob(
    Guid UserId,
    string Email,
    string? Phone,
    string CodeType,
    string Code,
    string Channel,
    string? CorrelationId,
    DateTime EnqueuedAtUtc);

/// <summary>
/// Bounded, in-memory queue for code-send jobs. The HTTP controller enqueues jobs
/// and returns immediately; <see cref="CodeDeliveryBackgroundService"/> drains the
/// queue and performs the real SMTP / SMS work off the request thread.
///
/// Registered as a singleton so producer (controller) and consumer (hosted service)
/// share the same channel instance.
/// </summary>
public sealed class CodeDeliveryQueue
{
    // Bounded to protect memory if SMTP stalls or a caller floods us.
    // DropOldest: if the queue is full we prefer to drop the oldest pending code
    // (it is likely already expired by the time we get to it) rather than block
    // the controller thread, which would re-introduce the latency we are fixing.
    private const int Capacity = 1000;

    private readonly Channel<CodeSendJob> _channel;
    private readonly ILogger<CodeDeliveryQueue> _logger;

    public CodeDeliveryQueue(ILogger<CodeDeliveryQueue> logger)
    {
        _logger = logger;
        var options = new BoundedChannelOptions(Capacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        };
        _channel = Channel.CreateBounded<CodeSendJob>(options);
    }

    /// <summary>
    /// Enqueue a code-send job. Non-blocking; returns true if accepted.
    /// With <see cref="BoundedChannelFullMode.DropOldest"/> this effectively
    /// always accepts, but we still log when we had to drop.
    /// </summary>
    public bool Enqueue(CodeSendJob job)
    {
        var written = _channel.Writer.TryWrite(job);
        if (!written)
        {
            _logger.LogWarning(
                "CodeDeliveryQueue rejected job for UserId={UserId}, Type={Type}. Queue writer closed?",
                job.UserId, job.CodeType);
            return false;
        }

        _logger.LogInformation(
            "CodeDeliveryQueue enqueued job UserId={UserId}, Type={Type}, Channel={Channel}, CorrelationId={CorrelationId}",
            job.UserId, job.CodeType, job.Channel, job.CorrelationId);
        return true;
    }

    /// <summary>
    /// Async-dequeue a single job. Awaits until an item is available or the
    /// cancellation token fires.
    /// </summary>
    public ValueTask<CodeSendJob> DequeueAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAsync(cancellationToken);
    }
}
