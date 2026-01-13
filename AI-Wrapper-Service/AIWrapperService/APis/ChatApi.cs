namespace AIWrapperService.APIs;

/// <summary>
/// Minimal API endpoints for chat completion.
/// Handles request validation and returns RFC-7807 ProblemDetails for errors.
/// </summary>
public static class ChatApi
{
    private const string EndpointPath = "/v1/chat/complete";

    /// <summary>
    /// Maps chat API endpoints to the application.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    /// <returns>The endpoint route builder for chaining.</returns>
    public static IEndpointRouteBuilder MapChatApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/v1/chat")
            .WithTags("Chat");

        group.MapPost("/complete", CompleteChatAsync)
            .WithName("ChatComplete")
            .WithSummary("Complete a chat conversation using the configured LLM")
            .Produces<ChatResponseDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests)
            .ProducesProblem(StatusCodes.Status502BadGateway);

        return app;
    }

    /// <summary>
    /// Handles POST /v1/chat/complete requests.
    /// </summary>
    /// <example>
    /// curl -X POST http://localhost:5160/v1/chat/complete \
    ///   -H "Content-Type: application/json" \
    ///   -H "X-Internal-API-Key: your-secret-key" \
    ///   -d '{
    ///     "sessionId": "sess_12345",
    ///     "messages": [
    ///       {"role": "user", "content": "I am feeling stressed today"}
    ///     ],
    ///     "temperature": 0.7
    ///   }'
    /// </example>
    private static async Task<IResult> CompleteChatAsync(
        ChatRequestDto request,
        IOpenAIChatService chatService,
        ILogger<ChatRequestDto> logger,
        CancellationToken ct)
    {
        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        try
        {
            // Validate request
            var validationErrors = ValidateRequest(request);
            if (validationErrors.Any())
            {
                logger.LogWarning(
                    "Validation failed for session {SessionId}. Errors: {Errors}",
                    request.SessionId,
                    string.Join(", ", validationErrors));

                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Validation Failed",
                    detail: string.Join(" ", validationErrors),
                    instance: EndpointPath,
                    extensions: new Dictionary<string, object?>
                    {
                        ["traceId"] = traceId,
                        ["errors"] = validationErrors
                    });
            }

            // Call service
            var response = await chatService.CompleteAsync(request, ct);
            return Results.Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            // Configuration error (missing API key, etc.)
            logger.LogError(ex, "Configuration error for request {TraceId}", traceId);
            return Results.Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Service Configuration Error",
                detail: "The AI service is not properly configured. Please contact support.",
                instance: EndpointPath,
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = traceId
                });
        }
        catch (HttpRequestException ex)
        {
            // Upstream provider failure
            logger.LogError(ex, "Upstream provider failed for request {TraceId}", traceId);
            return Results.Problem(
                statusCode: StatusCodes.Status502BadGateway,
                title: "Upstream Service Error",
                detail: "The AI provider is currently unavailable. Please try again later.",
                instance: EndpointPath,
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = traceId
                });
        }
        catch (TaskCanceledException ex)
        {
            // Timeout
            logger.LogError(ex, "Request timeout for {TraceId}", traceId);
            return Results.Problem(
                statusCode: StatusCodes.Status504GatewayTimeout,
                title: "Request Timeout",
                detail: "The request to the AI provider timed out. Please try again.",
                instance: EndpointPath,
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = traceId
                });
        }
        catch (Exception ex)
        {
            // Unexpected error
            logger.LogError(ex, "Unexpected error for request {TraceId}", traceId);
            return Results.Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Internal Server Error",
                detail: "An unexpected error occurred. Please try again later.",
                instance: EndpointPath,
                extensions: new Dictionary<string, object?>
                {
                    ["traceId"] = traceId
                });
        }
    }

    /// <summary>
    /// Validates the chat request and returns a list of error messages.
    /// </summary>
    private static List<string> ValidateRequest(ChatRequestDto request)
    {
        var errors = new List<string>();

        // SessionId validation
        if (string.IsNullOrWhiteSpace(request.SessionId))
        {
            errors.Add("SessionId cannot be empty.");
        }

        // Messages validation
        if (request.Messages == null || request.Messages.Count == 0)
        {
            errors.Add("Messages list cannot be empty.");
        }
        else
        {
            for (int i = 0; i < request.Messages.Count; i++)
            {
                var message = request.Messages[i];

                // Validate role
                if (!Enum.IsDefined(typeof(Role), message.Role))
                {
                    errors.Add($"Message[{i}]: Invalid role '{message.Role}'.");
                }

                // Validate content
                if (string.IsNullOrWhiteSpace(message.Content))
                {
                    errors.Add($"Message[{i}]: Content cannot be empty.");
                }
            }
        }

        // Temperature validation
        if (request.Temperature < 0.0 || request.Temperature > 1.0)
        {
            errors.Add("Temperature must be between 0.0 and 1.0.");
        }

        return errors;
    }
}
