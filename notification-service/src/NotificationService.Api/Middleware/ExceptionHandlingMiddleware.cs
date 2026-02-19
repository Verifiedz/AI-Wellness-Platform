namespace NotificationService.Api.Middleware;

using NotificationService.Api.Models.Responses;
using System.Text.Json;

/// <summary>
/// Global exception handling middleware
/// Catches unhandled exceptions and returns a consistent error response
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = exception switch
        {
            ArgumentException => 400,
            InvalidOperationException => 400,
            UnauthorizedAccessException => 401,
            KeyNotFoundException => 404,
            _ => 500
        };

        var response = new ErrorResponse
        {
            Error = exception.GetType().Name,
            Message = exception.Message,
            Timestamp = DateTime.UtcNow,
            // Only include details in development
            Details = _env.IsDevelopment() ? exception.StackTrace : null
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}