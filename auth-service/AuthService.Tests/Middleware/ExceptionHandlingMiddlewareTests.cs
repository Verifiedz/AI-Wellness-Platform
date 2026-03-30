using AIWellness.Auth.Exceptions;
using AIWellness.Auth.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text;

namespace AIWellness.Auth.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
  private static async Task<(int StatusCode, string Body)> InvokeMiddlewareWith(Exception exceptionToThrow)
  {
    var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
    RequestDelegate next = _ => throw exceptionToThrow;
    var middleware = new ExceptionHandlingMiddleware(next, logger.Object);

    var context = new DefaultHttpContext();
    var responseBody = new MemoryStream();
    context.Response.Body = responseBody;

    await middleware.InvokeAsync(context);

    responseBody.Seek(0, SeekOrigin.Begin);
    var body = await new StreamReader(responseBody, Encoding.UTF8).ReadToEndAsync();

    return (context.Response.StatusCode, body);
  }

  // SEC-07: Raw exception messages are never exposed in API responses
  [Fact]
  public async Task ExceptionResponse_DoesNotExposeMessage()
  {
    // Arrange: exception with a sensitive internal detail in the message
    var exception = new AuthSecurityException("INVALID_CREDENTIALS", "secret internal detail - user ID 42");

    // Act
    var (statusCode, body) = await InvokeMiddlewareWith(exception);

    // Assert
    Assert.Equal(401, statusCode);
    Assert.Contains("\"error\":\"INVALID_CREDENTIALS\"", body);
    Assert.DoesNotContain("secret internal detail", body);
    Assert.DoesNotContain("user ID 42", body);
  }

  [Fact]
  public async Task AuthValidationException_Returns400()
  {
    // Arrange
    var exception = new AuthValidationException("PASSWORD_POLICY", "internal detail");

    // Act
    var (statusCode, body) = await InvokeMiddlewareWith(exception);

    // Assert
    Assert.Equal(400, statusCode);
    Assert.Contains("\"error\":\"PASSWORD_POLICY\"", body);
    Assert.DoesNotContain("internal detail", body);
  }

  [Fact]
  public async Task AuthConflictException_Returns409()
  {
    // Arrange
    var exception = new AuthConflictException("EMAIL_EXISTS", "Email already in db");

    // Act
    var (statusCode, body) = await InvokeMiddlewareWith(exception);

    // Assert
    Assert.Equal(409, statusCode);
    Assert.Contains("\"error\":\"EMAIL_EXISTS\"", body);
    Assert.DoesNotContain("Email already in db", body);
  }

  [Fact]
  public async Task AuthNotFoundException_Returns404()
  {
    // Arrange
    var exception = new AuthNotFoundException("USER_NOT_FOUND", "internal user lookup failure");

    // Act
    var (statusCode, body) = await InvokeMiddlewareWith(exception);

    // Assert
    Assert.Equal(404, statusCode);
    Assert.Contains("\"error\":\"USER_NOT_FOUND\"", body);
    Assert.DoesNotContain("internal user lookup failure", body);
  }

  [Fact]
  public async Task GenericException_Returns500_WithInternalErrorCode()
  {
    // Arrange
    var exception = new Exception("Database connection failed with password: hunter2");

    // Act
    var (statusCode, body) = await InvokeMiddlewareWith(exception);

    // Assert
    Assert.Equal(500, statusCode);
    Assert.Contains("\"error\":\"INTERNAL_ERROR\"", body);
    Assert.DoesNotContain("hunter2", body);
    Assert.DoesNotContain("Database connection failed", body);
  }

  [Fact]
  public async Task ResponseShape_ContainsErrorMessageAndTimestamp()
  {
    // Arrange
    var exception = new AuthValidationException("PASSWORDS_DO_NOT_MATCH", "internal detail");

    // Act
    var (statusCode, body) = await InvokeMiddlewareWith(exception);

    // Assert: D-03 response shape
    Assert.Equal(400, statusCode);
    Assert.Contains("\"error\":", body);
    Assert.Contains("\"message\":", body);
    Assert.Contains("\"timestamp\":", body);
    // Generic user-facing message, not the internal one
    Assert.Contains("Passwords do not match", body);
    Assert.DoesNotContain("internal detail", body);
  }

  [Fact]
  public async Task SuccessfulRequest_DoesNotInterfereWithMiddleware()
  {
    // Arrange
    var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
    RequestDelegate next = ctx =>
    {
      ctx.Response.StatusCode = 200;
      return Task.CompletedTask;
    };
    var middleware = new ExceptionHandlingMiddleware(next, logger.Object);
    var context = new DefaultHttpContext();

    // Act
    await middleware.InvokeAsync(context);

    // Assert
    Assert.Equal(200, context.Response.StatusCode);
  }
}
