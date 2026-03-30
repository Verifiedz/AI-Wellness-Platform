using System.Text.Json.Serialization;

namespace ChatService.DTOs;

public sealed record ChatRequest(
    [property: JsonPropertyName("chatUserId")] Guid ChatUserId,
    [property: JsonPropertyName("messageRequest")] string MessageRequest,
    [property: JsonPropertyName("context")] string Context,
    [property: JsonPropertyName("sessionId")] Guid? SessionId);
