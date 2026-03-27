namespace JournalService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using JournalService.Api.Models.Requests;
using JournalService.Api.Models.Responses;
using JournalService.Api.Services;
using JournalService.Api.UserContext;

[ApiController]
[Route("api/journal/assessments")]
public class AssessmentController : ControllerBase
{
    private readonly IUserContext _userContext;
    private readonly AssessmentService _assessmentService;
    private readonly ILogger<AssessmentController> _logger;

    public AssessmentController(
        IUserContext userContext,
        AssessmentService assessmentService,
        ILogger<AssessmentController> logger)
    {
        _userContext = userContext;
        _assessmentService = assessmentService;
        _logger = logger;
    }

    /// <summary>Submit a completed assessment (PHQ-9 or GAD-7).</summary>
    /// <response code="201">Assessment scored and saved</response>
    /// <response code="400">Validation error</response>
    [HttpPost]
    [ProducesResponseType(typeof(AssessmentDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Submit([FromBody] SubmitAssessmentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(BuildValidationError());

            var userId = _userContext.CurrentUser.UserId;
            _logger.LogInformation(
                "Submitting {Type} assessment for user {UserId}",
                request.AssessmentType, userId);

            var result = await _assessmentService.SubmitAsync(userId, request);
            return StatusCode(StatusCodes.Status201Created, result);
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

    /// <summary>Get assessment history, optionally filtered by type.</summary>
    /// <response code="200">List of past assessments</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<AssessmentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] string? type = null,
        [FromQuery] int limit = 20,
        [FromQuery] int offset = 0)
    {
        var userId = _userContext.CurrentUser.UserId;
        var history = await _assessmentService.GetHistoryAsync(userId, type, limit, offset);
        return Ok(history);
    }

    /// <summary>Get the most recent assessment of a given type.</summary>
    /// <response code="200">Latest assessment found</response>
    /// <response code="404">No assessments of this type</response>
    [HttpGet("latest")]
    [ProducesResponseType(typeof(AssessmentDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLatest([FromQuery] string type = "PHQ9")
    {
        var userId = _userContext.CurrentUser.UserId;
        var latest = await _assessmentService.GetLatestAsync(userId, type);

        if (latest == null)
        {
            return NotFound(new ErrorResponse
            {
                Error = "NotFound",
                Message = $"No {type} assessments found.",
                Timestamp = DateTime.UtcNow
            });
        }

        return Ok(latest);
    }

    /// <summary>Compare first vs. latest assessment for a given type.</summary>
    /// <response code="200">Comparison data</response>
    [HttpGet("comparison")]
    [ProducesResponseType(typeof(AssessmentComparisonResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComparison([FromQuery] string type = "PHQ9")
    {
        var userId = _userContext.CurrentUser.UserId;
        var comparison = await _assessmentService.GetComparisonAsync(userId, type);
        return Ok(comparison);
    }

    private ErrorResponse BuildValidationError() => new()
    {
        Error = "ValidationError",
        Message = "Invalid request data",
        Timestamp = DateTime.UtcNow,
        Details = string.Join("; ", ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage))
    };
}
