using Serilog.Context;

namespace AIWellness.Auth.Middleware;

/// <summary>
/// Ensures every request is tagged with a correlation ID. We read the inbound
/// <c>X-Correlation-Id</c> header if present (so the mobile app and upstream
/// proxies can thread a single id across services), otherwise we mint a new
/// one. The id is written back to the response, pushed onto the Serilog log
/// context as <c>CorrelationId</c>, stored on <see cref="HttpContext.Items"/>
/// for downstream code, and propagated to Sentry scope via the scope tag.
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
