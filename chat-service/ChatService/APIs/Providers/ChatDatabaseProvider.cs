using ChatService.DTOs;
using ChatService.Interfaces;
using Npgsql;
namespace ChatService.APIs.Providers;

public class ChatDatabaseProvider : IChatDatabaseProvider
{
    public Chat createChat(int chatUserId)
    {
        throw new NotImplementedException();

    }

    public Chat deleteChat(Guid chatReferenceId)
    {
        throw new NotImplementedException();
    }

    public Chat getChat(Guid chatReferenceId)
    {
        throw new NotImplementedException();
    }

    public void setIsBookmarked(bool isBookmarked)
    {
        throw new NotImplementedException();
    }

    public Chat updateChat(Guid chatReferenceId)
    {
        throw new NotImplementedException();
    }
}

