namespace NotificationService.Api.Services;

using global::NotificationService.Api.Models.Entities;

/// <summary>
/// Service for managing wellness tips
/// </summary>
public class WellnessTipService
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<WellnessTipService> _logger;

    public WellnessTipService(
        DatabaseService databaseService,
        ILogger<WellnessTipService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    /// <summary>
    /// Get a random wellness tip for a user
    /// Ensures the tip hasn't been sent to this user recently
    /// </summary>
    public async Task<WellnessTip?> GetRandomTipForUserAsync(Guid userId)
    {
        _logger.LogDebug("Getting random tip for user {UserId}", userId);

        var tip = await _databaseService.GetRandomWellnessTipAsync(userId);

        if (tip == null)
        {
            _logger.LogWarning("No wellness tips available for user {UserId}", userId);
            return null;
        }

        _logger.LogInformation("Retrieved tip {TipId} for user {UserId}: {Category}", 
            tip.Id, userId, tip.Category);

        return tip;
    }

    /// <summary>
    /// Get a specific wellness tip by ID
    /// </summary>
    public async Task<WellnessTip?> GetTipByIdAsync(int tipId)
    {
        _logger.LogDebug("Getting tip {TipId}", tipId);

        var tip = await _databaseService.GetWellnessTipByIdAsync(tipId);

        if (tip == null)
        {
            _logger.LogWarning("Tip {TipId} not found", tipId);
        }

        return tip;
    }
}