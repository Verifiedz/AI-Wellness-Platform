namespace JournalService.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using JournalService.Api.Models.Requests;
using JournalService.Api.Models.Responses;
using JournalService.Api.Services;
using JournalService.Api.UserContext;

[ApiController]
[Route("api/journal/export")]
public class ExportController : ControllerBase
{
    private readonly IUserContext _userContext;
    private readonly ExportService _exportService;
    private readonly ILogger<ExportController> _logger;

    public ExportController(
        IUserContext userContext,
        ExportService exportService,
        ILogger<ExportController> logger)
    {
        _userContext = userContext;
        _exportService = exportService;
        _logger = logger;
    }

    /// <summary>Preview export data as JSON.</summary>
    [HttpPost("preview")]
    [ProducesResponseType(typeof(ExportDataResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Preview([FromBody] ExportRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(BuildValidationError());

        var user = _userContext.CurrentUser;
        var data = await _exportService.BuildExportDataAsync(user.UserId, user.Email, request);
        return Ok(data);
    }

    /// <summary>Generate and download a CSV export file.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Export([FromBody] ExportRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(BuildValidationError());

        var user = _userContext.CurrentUser;
        _logger.LogInformation(
            "Generating {Format} export for user {UserId}",
            request.Format, user.UserId);

        var data = await _exportService.BuildExportDataAsync(user.UserId, user.Email, request);

        // CSV is the default; PDF generation deferred to a future phase
        var bytes = _exportService.GenerateCsv(data);
        var fileName = $"sakina-wellness-report-{data.StartDate:yyyyMMdd}-{data.EndDate:yyyyMMdd}.csv";

        return File(bytes, "text/csv", fileName);
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
