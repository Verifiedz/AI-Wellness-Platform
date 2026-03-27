namespace JournalService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using JournalService.Api.Models.Requests;
using JournalService.Api.Models.Responses;
using JournalService.Api.Services;
using JournalService.Api.UserContext;

[ApiController]
[Route("api/journal")]
public class JournalController : ControllerBase
{
    private readonly IUserContext _userContext;
    private readonly JournalEntryService _journalService;
    private readonly PatternAnalysisService _patternService;
    private readonly ILogger<JournalController> _logger;

    public JournalController(
        IUserContext userContext,
        JournalEntryService journalService,
        PatternAnalysisService patternService,
        ILogger<JournalController> logger)
    {
        _userContext = userContext;
        _journalService = journalService;
        _patternService = patternService;
        _logger = logger;
    }

    /// <param name="request">Journal entry data</param>
    /// <response code="201">Entry created</response>
    /// <response code="400">Validation error or entry already exists for date</response>
    [HttpPost("entries")]
    [ProducesResponseType(typeof(JournalEntryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateEntry([FromBody] CreateJournalEntryRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(BuildValidationError());

            var userId = _userContext.CurrentUser.UserId;
            _logger.LogInformation("Creating journal entry for user {UserId}", userId);

            var entry = await _journalService.CreateEntryAsync(userId, request);
            return StatusCode(StatusCodes.Status201Created, entry);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Error = "InvalidArgument",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <param name="startDate">Optional start date filter (yyyy-MM-dd)</param>
    /// <param name="endDate">Optional end date filter (yyyy-MM-dd)</param>
    /// <param name="limit">Max entries to return (default 50)</param>
    /// <param name="offset">Pagination offset (default 0)</param>
    /// <response code="200">List of journal entries</response>
    [HttpGet("entries")]
    [ProducesResponseType(typeof(List<JournalEntryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEntries(
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        try
        {
            var userId = _userContext.CurrentUser.UserId;
            _logger.LogInformation("Getting journal entries for user {UserId}", userId);

            var entries = await _journalService.GetEntriesAsync(userId, startDate, endDate, limit, offset);
            return Ok(entries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting journal entries");
            throw;
        }
    }

    /// <param name="id">Entry ID</param>
    /// <response code="200">Journal entry found</response>
    /// <response code="404">Entry not found</response>
    [HttpGet("entries/{id:guid}")]
    [ProducesResponseType(typeof(JournalEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEntryById(Guid id)
    {
        try
        {
            var userId = _userContext.CurrentUser.UserId;
            var entry = await _journalService.GetEntryByIdAsync(id, userId);

            if (entry == null)
            {
                return NotFound(new ErrorResponse
                {
                    Error = "NotFound",
                    Message = "Journal entry not found.",
                    Timestamp = DateTime.UtcNow
                });
            }

            return Ok(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting journal entry {EntryId}", id);
            throw;
        }
    }

    /// <param name="date">Entry date (yyyy-MM-dd)</param>
    /// <response code="200">Journal entry found</response>
    /// <response code="404">No entry for this date</response>
    [HttpGet("entries/date/{date}")]
    [ProducesResponseType(typeof(JournalEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEntryByDate(DateOnly date)
    {
        try
        {
            var userId = _userContext.CurrentUser.UserId;
            var entry = await _journalService.GetEntryByDateAsync(userId, date);

            if (entry == null)
            {
                return NotFound(new ErrorResponse
                {
                    Error = "NotFound",
                    Message = $"No journal entry found for {date:yyyy-MM-dd}.",
                    Timestamp = DateTime.UtcNow
                });
            }

            return Ok(entry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting journal entry for date {Date}", date);
            throw;
        }
    }

    /// <param name="id">Entry ID</param>
    /// <param name="request">Updated journal entry data</param>
    /// <response code="200">Entry updated</response>
    /// <response code="404">Entry not found</response>
    [HttpPut("entries/{id:guid}")]
    [ProducesResponseType(typeof(JournalEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateEntry(Guid id, [FromBody] UpdateJournalEntryRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(BuildValidationError());

            var userId = _userContext.CurrentUser.UserId;
            _logger.LogInformation("Updating journal entry {EntryId} for user {UserId}", id, userId);

            var entry = await _journalService.UpdateEntryAsync(id, userId, request);
            return Ok(entry);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse
            {
                Error = "NotFound",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse
            {
                Error = "InvalidArgument",
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <param name="id">Entry ID</param>
    /// <response code="204">Entry deleted</response>
    /// <response code="404">Entry not found</response>
    [HttpDelete("entries/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEntry(Guid id)
    {
        try
        {
            var userId = _userContext.CurrentUser.UserId;
            _logger.LogInformation("Deleting journal entry {EntryId} for user {UserId}", id, userId);

            var deleted = await _journalService.DeleteEntryAsync(id, userId);

            if (!deleted)
            {
                return NotFound(new ErrorResponse
                {
                    Error = "NotFound",
                    Message = "Journal entry not found.",
                    Timestamp = DateTime.UtcNow
                });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting journal entry {EntryId}", id);
            throw;
        }
    }

    /// <param name="startDate">Start date (yyyy-MM-dd)</param>
    /// <param name="endDate">End date (yyyy-MM-dd)</param>
    /// <response code="200">Mood summary statistics</response>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(MoodSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMoodSummary(
        [FromQuery] DateOnly? startDate = null,
        [FromQuery] DateOnly? endDate = null)
    {
        try
        {
            var userId = _userContext.CurrentUser.UserId;

            var start = startDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
            var end = endDate ?? DateOnly.FromDateTime(DateTime.UtcNow);

            _logger.LogInformation("Getting mood summary for user {UserId} from {Start} to {End}",
                userId, start, end);

            var summary = await _journalService.GetMoodSummaryAsync(userId, start, end);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting mood summary");
            throw;
        }
    }

    /// <param name="category">Optional prompt category filter</param>
    /// <response code="200">Random journal prompt</response>
    /// <response code="404">No prompts available</response>
    [HttpGet("prompt")]
    [ProducesResponseType(typeof(JournalPromptResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRandomPrompt([FromQuery] string? category = null)
    {
        try
        {
            var prompt = await _journalService.GetRandomPromptAsync(category);

            if (prompt == null)
            {
                return NotFound(new ErrorResponse
                {
                    Error = "NotFound",
                    Message = "No journal prompts available.",
                    Timestamp = DateTime.UtcNow
                });
            }

            return Ok(prompt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting random prompt");
            throw;
        }
    }

    /// <param name="days">Number of days to analyze (default 30, max 90)</param>
    /// <response code="200">Pattern insights for the user's journal entries</response>
    [HttpGet("insights")]
    [ProducesResponseType(typeof(PatternInsightsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPatternInsights([FromQuery] int days = 30)
    {
        try
        {
            var userId = _userContext.CurrentUser.UserId;
            var clampedDays = Math.Clamp(days, 7, 90);
            var endDate = DateOnly.FromDateTime(DateTime.UtcNow);
            var startDate = endDate.AddDays(-clampedDays);

            _logger.LogInformation(
                "Getting pattern insights for user {UserId} over {Days} days",
                userId, clampedDays);

            var entries = await _journalService.GetEntriesAsync(
                userId, startDate, endDate, limit: 500, offset: 0);

            // Map response DTOs back to entities for analysis
            var entities = entries.Select(e => new Models.Entities.JournalEntry
            {
                Id = e.Id,
                UserId = e.UserId,
                Mood = e.Mood,
                Emotions = e.Emotions,
                EnergyLevel = e.EnergyLevel,
                Content = e.Content,
                EntryDate = DateOnly.Parse(e.EntryDate),
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            }).ToList();

            var insights = _patternService.Analyze(entities, startDate, endDate);
            return Ok(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pattern insights");
            throw;
        }
    }

    private ErrorResponse BuildValidationError()
    {
        return new ErrorResponse
        {
            Error = "ValidationError",
            Message = "Invalid request data",
            Timestamp = DateTime.UtcNow,
            Details = string.Join("; ", ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage))
        };
    }
}
