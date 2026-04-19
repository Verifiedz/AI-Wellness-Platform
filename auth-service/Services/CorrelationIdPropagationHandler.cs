using AIWellness.Auth.Middleware;

namespace AIWellness.Auth.Services;

/// <summary>
/// DelegatingHandler that copies the current request's correlation id onto any
/// outgoing HttpClient call. Ensures downstream services log under the same
/// correlation id, which is the core requirement of distributed tracing.
/// </summary>
public sealed class CorrelationIdPropagationHandler : DelegatingHandler
{
  private readonly IHttpContextAccessor _httpContextAccessor;

  public CorrelationIdPropagationHandler(IHttpContextAccessor httpContextAccessor)
  {
    _httpContextAccessor = httpContextAccessor;
  }

  protected override Task<HttpResponseMessage> SendAsync(
      HttpRequestMessage request, CancellationToken cancellationToken)
  {
    var httpContext = _httpContextAccessor.HttpContext;
    if (httpContext is not null
        && httpContext.Items.TryGetValue(CorrelationIdMiddleware.HttpContextKey, out var idObj)
        && idObj is string id
        && !request.Headers.Contains(CorrelationIdMiddleware.HeaderName))
    {
      request.Headers.TryAddWithoutValidation(CorrelationIdMiddleware.HeaderName, id);
    }

    return base.SendAsync(request, cancellationToken);
  }
}
