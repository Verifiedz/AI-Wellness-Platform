namespace NotificationService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using NotificationService.Api.Models.Responses;
using NotificationService.Api.Services;
using System.Reflection;

/// <summary>
/// Health check controller for monitoring service status
/// This endpoint can be accessed without authentication
/// </summary>
[ApiController]
[Route("api")]
public class HealthController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(
        DatabaseService databaseService,
        ILogger<HealthController> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    /// <summary>
    /// Health check endpoint
    /// Verifies database connectivity and returns service status
    /// </summary>
    /// <response code="200">Service is healthy</response>
    /// <response code="503">Service is unhealthy (database not accessible)</response>
    [HttpGet("health")]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(HealthCheckResponse), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> HealthCheck()
    {
        try
        {
            _logger.LogDebug("Health check requested");

            // Test database connectivity
            var isDatabaseHealthy = await _databaseService.TestConnectionAsync();

            var response = new HealthCheckResponse
            {
                Status = isDatabaseHealthy ? "Healthy" : "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Database = isDatabaseHealthy ? "Connected" : "Disconnected",
                Version = Assembly.GetExecutingAssembly()
                    .GetName()
                    .Version
                    ?.ToString() ?? "Unknown"
            };

            if (isDatabaseHealthy)
            {
                _logger.LogInformation("Health check passed");
                return Ok(response);
            }
            else
            {
                _logger.LogWarning("Health check failed - database not accessible");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed with exception");
            
            var response = new HealthCheckResponse
            {
                Status = "Unhealthy",
                Timestamp = DateTime.UtcNow,
                Database = "Error",
                Version = "Unknown"
            };

            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }
    }

    /// <summary>
    /// Simple ping endpoint to verify service is running
    /// </summary>
    /// <response code="200">Service is running</response>
    [HttpGet("ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Ping()
    {
        _logger.LogDebug("Ping requested");
        return Ok(new { message = "pong", timestamp = DateTime.UtcNow });
    }
}