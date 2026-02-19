using AIWrapperService.DTOs;

namespace AIWrapperService.Interfaces;

public interface IOpenAIChatService
{
    /// <summary>
    /// Sends a chat message to the AI provider and returns the response.
    /// </summary>
    /// <param name="req">The chat request containing user message and metadata.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The AI-generated chat response.</returns>
    Task<ChatResponse> GetChatResponseAsync(ChatRequest req, CancellationToken ct = default);
}
