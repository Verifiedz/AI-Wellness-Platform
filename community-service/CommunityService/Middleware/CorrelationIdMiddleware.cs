using Serilog.Context;

namespace CommunityService.Middleware;

/// <summary>
/// Propagates a correlation id across the request lifecycle for distributed
/// tracing. Reads inbound <c>X-Correlation-Id</c> or mints a fresh GUID,
/// pushes it onto the Serilog log context, adds a Sentry scope tag, and
/// writes it back on the response.
/// </summary>
public sealed class CorrelationIdMiddleware
{
  public const string HeaderName = "X-Correlation-Id";
  public const string HttpContextKey = "CorrelationId";

  private readonly RequestDelegate _next;

  public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

  public async Task InvokeAsync(HttpContext context)
  {
    var correlationId = context.Request.Headers.TryGetValue(HeaderName, out var values)
                        && !string.IsNullOrWhiteSpace(values.FirstOrDefault())
      ? values.ToString()
      : Guid.NewGuid().ToString("N");

    context.Items[HttpContextKey] = correlationId;
    context.Response.OnStarting(() =>
    {
      if (!context.Response.Headers.ContainsKey(HeaderName))
        context.Response.Headers[HeaderName] = correlationId;
      return Task.CompletedTask;
    });

    using (LogContext.PushProperty("CorrelationId", correlationId))
    {
      SentrySdk.ConfigureScope(scope => scope.SetTag("correlation_id", correlationId));
      await _next(context);
    }
  }
}
