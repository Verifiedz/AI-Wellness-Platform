using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatDatabaseProvider 
{
    public Task createChatAsync(Chat chat);

    public Task updateChatAsync(Guid chatReferenceId);

    public Task deleteChatAsync(Guid chatReferenceId);

    public Task<Chat?> getChatAsync(Guid chatReferenceId);

    public Task setIsBookmarkedAsync(bool isBookmarked);
}
