namespace NotificationService.Api.Services;

using global::NotificationService.Api.Infrastructure;
using global::NotificationService.Api.Models.Entities;
using Npgsql;
using NpgsqlTypes;

/// <summary>
/// Service for database operations using stored procedures
/// Wraps StoredProcedureExecutor with domain-specific methods
/// </summary>
public class DatabaseService
{
    private readonly StoredProcedureExecutor _executor;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(
        StoredProcedureExecutor executor,
        ILogger<DatabaseService> logger)
    {
        _executor = executor;
        _logger = logger;
    }

    #region User Preferences

    /// <summary>
    /// Get user notification preferences
    /// </summary>
    public async Task<UserNotificationPreferences?> GetUserPreferencesAsync(Guid userId)
    {
        _logger.LogDebug("Getting preferences for user {UserId}", userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_get_user_preferences",
            parameters,
            reader => new UserNotificationPreferences
            {
                UserId = reader.GetGuidSafe("user_id"),
                IsEnabled = reader.GetBooleanSafe("is_enabled"),
                PreferredTimeUtc = reader.GetTimeSpanSafe("preferred_time_utc"),
                Timezone = reader.GetStringSafe("timezone"),
                DeviceToken = reader.GetStringNullable("device_token"),
                CreatedAt = reader.GetDateTimeSafe("created_at"),
                UpdatedAt = reader.GetDateTimeSafe("updated_at")
            });
    }

    /// <summary>
    /// Create or update user notification preferences
    /// </summary>
    public async Task<UserNotificationPreferences> UpsertUserPreferencesAsync(
        Guid userId,
        bool isEnabled,
        TimeSpan preferredTimeUtc,
        string timezone,
        string? deviceToken = null)
    {
        _logger.LogInformation("Upserting preferences for user {UserId}", userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_is_enabled", NpgsqlDbType.Boolean) { Value = isEnabled },
            new NpgsqlParameter("p_preferred_time_utc", NpgsqlDbType.Time) { Value = preferredTimeUtc },
            new NpgsqlParameter("p_timezone", NpgsqlDbType.Varchar) { Value = timezone },
            new NpgsqlParameter("p_device_token", NpgsqlDbType.Varchar) 
            { 
                Value = (object?)deviceToken ?? DBNull.Value 
            }
        };

        var result = await _executor.ExecuteSingleAsync(
            "sp_upsert_user_preferences",
            parameters,
            reader => new UserNotificationPreferences
            {
                UserId = reader.GetGuidSafe("user_id"),
                IsEnabled = reader.GetBooleanSafe("is_enabled"),
                PreferredTimeUtc = reader.GetTimeSpanSafe("preferred_time_utc"),
                Timezone = reader.GetStringSafe("timezone"),
                DeviceToken = reader.GetStringNullable("device_token"),
                CreatedAt = reader.GetDateTimeSafe("created_at"),
                UpdatedAt = reader.GetDateTimeSafe("updated_at")
            });

        return result ?? throw new InvalidOperationException("Failed to upsert user preferences");
    }

    /// <summary>
    /// Register or update device token for push notifications
    /// </summary>
    public async Task<UserNotificationPreferences> RegisterDeviceTokenAsync(Guid userId, string deviceToken)
    {
        _logger.LogInformation("Registering device token for user {UserId}", userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_device_token", NpgsqlDbType.Varchar) { Value = deviceToken }
        };

        var result = await _executor.ExecuteSingleAsync(
            "sp_register_device_token",
            parameters,
            reader => new UserNotificationPreferences
            {
                UserId = reader.GetGuidSafe("user_id"),
                IsEnabled = reader.GetBooleanSafe("is_enabled"),
                PreferredTimeUtc = reader.GetTimeSpanSafe("preferred_time_utc"),
                Timezone = reader.GetStringSafe("timezone"),
                DeviceToken = reader.GetStringNullable("device_token"),
                CreatedAt = DateTime.UtcNow, // Not returned by this procedure
                UpdatedAt = reader.GetDateTimeSafe("updated_at")
            });

        return result ?? throw new InvalidOperationException("Failed to register device token");
    }

    #endregion

    #region Wellness Tips

    /// <summary>
    /// Get a random wellness tip that user hasn't received recently
    /// </summary>
    public async Task<WellnessTip?> GetRandomWellnessTipAsync(Guid userId)
    {
        _logger.LogDebug("Getting random wellness tip for user {UserId}", userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_get_random_wellness_tip",
            parameters,
            reader => new WellnessTip
            {
                Id = reader.GetInt32Safe("id"),
                Content = reader.GetStringSafe("content"),
                Category = reader.GetStringSafe("category"),
                CreatedAt = DateTime.UtcNow // Not returned by this procedure
            });
    }

    /// <summary>
    /// Get a specific wellness tip by ID
    /// </summary>
    public async Task<WellnessTip?> GetWellnessTipByIdAsync(int tipId)
    {
        _logger.LogDebug("Getting wellness tip {TipId}", tipId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_tip_id", NpgsqlDbType.Integer) { Value = tipId }
        };

        return await _executor.ExecuteSingleAsync(
            "sp_get_wellness_tip_by_id",
            parameters,
            reader => new WellnessTip
            {
                Id = reader.GetInt32Safe("id"),
                Content = reader.GetStringSafe("content"),
                Category = reader.GetStringSafe("category"),
                CreatedAt = reader.GetDateTimeSafe("created_at")
            });
    }

    #endregion

    #region Notification Scheduling & Logging

    /// <summary>
    /// Get users who are due for notification at the current hour
    /// </summary>
    public async Task<List<UserDueForNotification>> GetUsersDueForNotificationAsync(int currentHour)
    {
        _logger.LogDebug("Getting users due for notification at hour {CurrentHour}", currentHour);

        var parameters = new[]
        {
            new NpgsqlParameter("p_current_hour", NpgsqlDbType.Integer) { Value = currentHour }
        };

        return await _executor.ExecuteReaderAsync(
            "sp_get_users_due_for_notification",
            parameters,
            reader => new UserDueForNotification
            {
                UserId = reader.GetGuidSafe("user_id"),
                DeviceToken = reader.GetStringSafe("device_token"),
                Timezone = reader.GetStringSafe("timezone"),
                PreferredTimeUtc = reader.GetTimeSpanSafe("preferred_time_utc")
            });
    }

    /// <summary>
    /// Log a notification delivery attempt
    /// </summary>
    public async Task<long> LogNotificationAttemptAsync(
        Guid userId,
        int tipId,
        string status,
        string? errorMessage = null,
        string? deviceToken = null)
    {
        _logger.LogDebug("Logging notification attempt for user {UserId}, tip {TipId}, status {Status}", 
            userId, tipId, status);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId },
            new NpgsqlParameter("p_tip_id", NpgsqlDbType.Integer) { Value = tipId },
            new NpgsqlParameter("p_status", NpgsqlDbType.Varchar) { Value = status },
            new NpgsqlParameter("p_error_message", NpgsqlDbType.Text) 
            { 
                Value = (object?)errorMessage ?? DBNull.Value 
            },
            new NpgsqlParameter("p_device_token", NpgsqlDbType.Varchar) 
            { 
                Value = (object?)deviceToken ?? DBNull.Value 
            }
        };

        var result = await _executor.ExecuteScalarAsync<long>("sp_log_notification_attempt", parameters);
        return result;
    }

    /// <summary>
    /// Check if user already received notification today
    /// </summary>
    public async Task<bool> CheckNotificationSentTodayAsync(Guid userId)
    {
        _logger.LogDebug("Checking if notification sent today for user {UserId}", userId);

        var parameters = new[]
        {
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Uuid) { Value = userId }
        };

        var result = await _executor.ExecuteScalarAsync<bool>("sp_check_notification_sent_today", parameters);
        return result;
    }

    #endregion

    #region Job Coordination

    /// <summary>
    /// Acquire distributed lock for notification job
    /// </summary>
    public async Task<bool> AcquireNotificationJobLockAsync()
    {
        _logger.LogDebug("Attempting to acquire notification job lock");

        var result = await _executor.ExecuteScalarAsync<bool>("sp_acquire_notification_job_lock", null);
        
        if (result)
        {
            _logger.LogInformation("Successfully acquired notification job lock");
        }
        else
        {
            _logger.LogDebug("Failed to acquire lock - another instance is processing");
        }

        return result;
    }

    /// <summary>
    /// Release distributed lock for notification job
    /// </summary>
    public async Task<bool> ReleaseNotificationJobLockAsync()
    {
        _logger.LogDebug("Releasing notification job lock");

        var result = await _executor.ExecuteScalarAsync<bool>("sp_release_notification_job_lock", null);
        
        if (result)
        {
            _logger.LogInformation("Successfully released notification job lock");
        }
        else
        {
            _logger.LogWarning("Failed to release lock - lock was not held");
        }

        return result;
    }

    #endregion

    #region Health Check

    /// <summary>
    /// Test database connectivity
    /// </summary>
    public async Task<bool> TestConnectionAsync()
    {
        return await _executor.TestConnectionAsync();
    }

    #endregion
}