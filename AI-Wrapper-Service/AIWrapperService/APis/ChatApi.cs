using AIWrapperService.DTOs;
using AIWrapperService.Interfaces;

namespace AIWrapperService.APIs;

public static class ChatApi
{
    public static IEndpointRouteBuilder MapChatApi(this IEndpointRouteBuilder app)
    {
        var grp = app.MapGroup("/v1/chat").WithTags("chat");

        grp.MapPost("/complete", async (ChatRequestDto req, IOpenAIChatService ai, CancellationToken ct) =>
        {
            if (req.Messages is null || req.Messages.Count == 0)
                return Results.BadRequest("Messages cannot be empty.");

            var result = await ai.CompleteAsync(req, ct);
            return Results.Ok(result);
        })
        .WithName("ChatComplete")
        .Produces<ChatResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest);

        return app;
    }
}
