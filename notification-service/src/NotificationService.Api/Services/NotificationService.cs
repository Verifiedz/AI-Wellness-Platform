namespace NotificationService.Api.Services;

using global::NotificationService.Api.Models.Entities;
using global::NotificationService.Api.Models.Requests;
using global::NotificationService.Api.Models.Responses;

/// <summary>
/// Service for managing user notification preferences and operations
/// </summary>
public class NotificationService
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        DatabaseService databaseService,
        ILogger<NotificationService> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    /// <summary>
    /// Get user notification preferences
    /// </summary>
    public async Task<PreferencesResponse?> GetUserPreferencesAsync(Guid userId)
    {
        _logger.LogDebug("Getting preferences for user {UserId}", userId);

        var preferences = await _databaseService.GetUserPreferencesAsync(userId);

        if (preferences == null)
        {
            _logger.LogInformation("No preferences found for user {UserId}", userId);
            return null;
        }

        return MapToPreferencesResponse(preferences);
    }

    /// <summary>
    /// Update user notification preferences
    /// </summary>
    public async Task<PreferencesResponse> UpdateUserPreferencesAsync(
        Guid userId,
        UpdatePreferencesRequest request)
    {
        _logger.LogInformation("Updating preferences for user {UserId}", userId);

        // Parse the time string (format: HH:mm:ss)
        if (!TimeSpan.TryParse(request.PreferredTimeUtc, out var preferredTime))
        {
            throw new ArgumentException("Invalid time format. Expected HH:mm:ss (e.g., 09:00:00)");
        }

        // Validate timezone (basic validation - just check it's not empty)
        if (string.IsNullOrWhiteSpace(request.Timezone))
        {
            throw new ArgumentException("Timezone cannot be empty");
        }

        var preferences = await _databaseService.UpsertUserPreferencesAsync(
            userId,
            request.IsEnabled,
            preferredTime,
            request.Timezone,
            null); // Don't update device token here

        _logger.LogInformation("Successfully updated preferences for user {UserId}", userId);

        return MapToPreferencesResponse(preferences);
    }

    /// <summary>
    /// Register device token for push notifications
    /// </summary>
    public async Task<DeviceRegistrationResponse> RegisterDeviceTokenAsync(
        Guid userId,
        string deviceToken)
    {
        _logger.LogInformation("Registering device token for user {UserId}", userId);

        if (string.IsNullOrWhiteSpace(deviceToken))
        {
            throw new ArgumentException("Device token cannot be empty");
        }

        var preferences = await _databaseService.RegisterDeviceTokenAsync(userId, deviceToken);

        _logger.LogInformation("Successfully registered device token for user {UserId}", userId);

        return new DeviceRegistrationResponse
        {
            UserId = preferences.UserId,
            IsEnabled = preferences.IsEnabled,
            PreferredTimeUtc = preferences.PreferredTimeUtc.ToString(@"hh\:mm\:ss"),
            Timezone = preferences.Timezone,
            DeviceToken = preferences.DeviceToken ?? string.Empty,
            UpdatedAt = preferences.UpdatedAt
        };
    }

    /// <summary>
    /// Check if user has already received notification today
    /// </summary>
    public async Task<bool> HasReceivedNotificationTodayAsync(Guid userId)
    {
        return await _databaseService.CheckNotificationSentTodayAsync(userId);
    }

    private static PreferencesResponse MapToPreferencesResponse(UserNotificationPreferences preferences)
    {
        return new PreferencesResponse
        {
            UserId = preferences.UserId,
            IsEnabled = preferences.IsEnabled,
            PreferredTimeUtc = preferences.PreferredTimeUtc.ToString(@"hh\:mm\:ss"),
            Timezone = preferences.Timezone,
            DeviceToken = preferences.DeviceToken,
            CreatedAt = preferences.CreatedAt,
            UpdatedAt = preferences.UpdatedAt
        };
    }
}