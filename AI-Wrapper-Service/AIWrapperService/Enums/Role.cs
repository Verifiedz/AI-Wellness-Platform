namespace AIWrapperService.Enums;

/// Supported chat message roles.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Role
{
    System,
    User,
    Assistant
}
