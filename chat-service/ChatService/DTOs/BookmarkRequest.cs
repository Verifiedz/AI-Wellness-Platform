using System.Text.Json.Serialization;

namespace ChatService.DTOs;

public sealed record BookmarkRequest(
    [property: JsonPropertyName("isBookmarked")] bool IsBookmarked);
