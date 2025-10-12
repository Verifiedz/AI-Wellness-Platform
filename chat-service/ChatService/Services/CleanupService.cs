namespace ChatService.Services;

public class CleanupService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
    }
}
