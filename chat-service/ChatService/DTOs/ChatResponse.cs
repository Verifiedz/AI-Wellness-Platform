using System.Text.Json.Serialization;

namespace ChatService.DTOs;

public sealed record ChatResponse(
    [property: JsonPropertyName("chatUserId")] Guid ChatUserId,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("context")] string Context,
    [property: JsonPropertyName("sessionId")] Guid SessionId);
