using AIWrapperService.DTOs;

namespace AIWrapperService.Interfaces;

public interface IOpenAIChatService
{
    Task<ChatResponseDto> CompleteAsync(ChatRequestDto req, CancellationToken ct = default);
}
