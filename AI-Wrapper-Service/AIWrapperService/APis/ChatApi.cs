namespace AIWrapperService.APIs;

/// <summary>
/// Minimal API endpoints for chat completion.
/// Handles request validation and returns RFC-7807 ProblemDetails for errors.
/// </summary>
public static class ChatApi
{
    private const string EndpointPath = "/chat/ChatResponse";

    /// <summary>
    /// Maps chat API endpoints to the application.
    /// </summary>
    public static IEndpointRouteBuilder MapChatApi(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/chat")
            .WithTags("Chat");

        group.MapPost("/ChatResponse", CompleteChatAsync)
            .WithName("ChatComplete")
            .WithSummary("Complete a chat conversation using the configured LLM")
            .Produces<ChatResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status429TooManyRequests)
            .ProducesProblem(StatusCodes.Status500InternalServerError)
            .ProducesProblem(StatusCodes.Status502BadGateway)
            .ProducesProblem(StatusCodes.Status504GatewayTimeout);

        return app;
    }

    /// <summary>
    /// Handles POST /v1/chat/complete requests.
    /// </summary>
    private static async Task<IResult> CompleteChatAsync(
        ChatRequest request,
        IOpenAIChatService chatService,
        ILogger<ChatRequest> logger,
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
                    "Validation failed for user {ChatUserId}. Errors: {Errors}",
                    request.chatUserId,
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
            var response = await chatService.GetChatResponseAsync(request, ct);
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
    private static List<string> ValidateRequest(ChatRequest request)
    {
        var errors = new List<string>();

        // chatUserId validation
        if (request.chatUserId == Guid.Empty)
        {
            errors.Add("chatUserId is required.");
        }

        // messageRequest validation
        if (string.IsNullOrWhiteSpace(request.messageRequest))
        {
            errors.Add("messageRequest cannot be empty.");
        }

        // sessionId validation
        if (request.sessionId == null || request.sessionId == Guid.Empty)
        {
            errors.Add("sessionId is required.");
        }

        return errors;
    }
}
