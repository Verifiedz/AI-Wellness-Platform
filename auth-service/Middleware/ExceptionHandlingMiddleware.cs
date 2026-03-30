using AIWellness.Auth.Exceptions;
using System.Text.Json;

namespace AIWellness.Auth.Middleware;

public class ExceptionHandlingMiddleware
{
  private readonly RequestDelegate _next;
  private readonly ILogger<ExceptionHandlingMiddleware> _logger;

  public ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
  {
    _next = next;
    _logger = logger;
  }

  public async Task InvokeAsync(HttpContext context)
  {
    try
    {
      await _next(context);
    }
    catch (Exception ex)
    {
      await HandleExceptionAsync(context, ex);
    }
  }

  private async Task HandleExceptionAsync(HttpContext context, Exception exception)
  {
    string errorCode;
    string message;
    int statusCode;

    if (exception is AuthException authEx)
    {
      errorCode = authEx.ErrorCode;
      message = GetGenericMessage(authEx.ErrorCode);
      statusCode = authEx switch
      {
        AuthValidationException => 400,
        AuthConflictException => 409,
        AuthSecurityException => 401,
        AuthNotFoundException => 404,
        _ => 500
      };
    }
    else
    {
      errorCode = "INTERNAL_ERROR";
      message = "An unexpected error occurred. Please try again.";
      statusCode = exception switch
      {
        ArgumentException => 400,
        InvalidOperationException => 400,
        UnauthorizedAccessException => 401,
        KeyNotFoundException => 404,
        _ => 500
      };
    }

    _logger.LogError(exception, "Request failed with {ErrorCode}: {InternalMessage}", errorCode, exception.Message);

    context.Response.ContentType = "application/json";
    context.Response.StatusCode = statusCode;

    var response = new
    {
      error = errorCode,
      message = message,
      timestamp = DateTime.UtcNow
    };

    var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });

    await context.Response.WriteAsync(json);
  }

  private static string GetGenericMessage(string errorCode) => errorCode switch
  {
    "PASSWORD_POLICY" => "Password does not meet requirements.",
    "EMAIL_EXISTS" => "An account with this email already exists.",
    "USERNAME_EXISTS" => "This username is already taken.",
    "PHONE_EXISTS" => "This phone number is already registered.",
    "INVALID_CREDENTIALS" => "Invalid credentials.",
    "ACCOUNT_DEACTIVATED" => "Account is deactivated.",
    "ACCOUNT_LOCKED" => "Account is temporarily locked. Please try again later.",
    "EMAIL_NOT_VERIFIED" => "Please verify your email first.",
    "INVALID_2FA_CODE" => "Invalid or expired verification code.",
    "USER_NOT_FOUND" => "The requested resource was not found.",
    "EMAIL_ALREADY_VERIFIED" => "Email is already verified.",
    "INVALID_VERIFICATION_CODE" => "Invalid or expired verification code.",
    "PASSWORDS_DO_NOT_MATCH" => "Passwords do not match.",
    "SAME_PASSWORD" => "New password must be different from current password.",
    "INVALID_RESET_CODE" => "Invalid or expired reset code.",
    "WRONG_CURRENT_PASSWORD" => "Current password is incorrect.",
    _ => "An error occurred. Please try again."
  };
}
