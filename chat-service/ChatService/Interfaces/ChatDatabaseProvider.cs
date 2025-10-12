using ChatService.DTOs;

namespace ChatService.Interfaces;

public interface IChatDatabaseProvider 
{
    public Chat createChat(int chatUserId);

    public Chat updateChat(Guid chatReferenceId);

    public Chat deleteChat(Guid chatReferenceId);

    public Chat getChat(Guid chatReferenceId);

    public void setIsBookmarked(bool isBookmarked);
}
