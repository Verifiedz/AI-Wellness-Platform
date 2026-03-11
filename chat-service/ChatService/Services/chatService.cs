namespace ChatService.Services;
using ChatService.Interfaces;
using ChatService.DTOs;
using ChatService.entities; 
public class chatService : IChatService
{
  private readonly ISessionService _sessionService;
  private readonly IChatWrapperClientInterface _chatWrapperClient;
  private readonly IChatDatabaseProvider _chatdatbaseProvider; 

  public chatService(
      IChatWrapperClientInterface chatWrapperClient,
      ISessionService sessionService,
      IChatDatabaseProvider chatDatabaseProvider)
  {
    _sessionService = sessionService;
    _chatWrapperClient = chatWrapperClient;
    _chatdatbaseProvider = chatDatabaseProvider;
  }

  public async Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest)
  {
    if (chatRequest == null)
    {
      throw new NullReferenceException("chatRequest returned null response");
    }

    if (string.IsNullOrWhiteSpace(chatRequest.messageRequest))
    {
      throw new ArgumentException("Message cannot be empty");
    }

    var session = await _sessionService.GetOrCreateSessionAsync(chatRequest.chatUserId, chatRequest.sessionId);
    var updatedChatRequest = chatRequest with { sessionId = session.sessionID };

    var requestChatObject = CreateChatFromRequest(updatedChatRequest, session.sessionID);
    await _chatdatbaseProvider.createChatAsync(requestChatObject); 

    var chatResponse = await _chatWrapperClient.getChatResponseAsync(updatedChatRequest);
    var normalizedChatResponse = chatResponse with
    {
      sessionId = session.sessionID,
      chatUserId = chatRequest.chatUserId
    };

    var responseChatObject = CreateChatFromResponse(normalizedChatResponse, session.sessionID); 
    await _chatdatbaseProvider.createChatAsync(responseChatObject); 
   
    return normalizedChatResponse;
  }

  public async Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionId, Guid userId)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("No chatReferenceId found");
    }

    var session = await _sessionService.GetOrCreateSessionAsync(userId, sessionId);
    return await _chatdatbaseProvider.getChatsBySessionAsync(session.sessionID);
  }

  private Chat CreateChatFromRequest(ChatRequest chatRequest, Guid sessionId)
  {
    if (chatRequest == null)
    {
      throw new NullReferenceException("chatResponse returned a null response");
    }

    return new Chat
    {
      chatUserId = chatRequest.chatUserId,
      chatReferenceId = Guid.NewGuid(),
      message = chatRequest.messageRequest,
      sessionId = sessionId,
      status = enums.Status.dummy1, 
      isBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };
  }

  private Chat CreateChatFromResponse(ChatResponse chatResponse, Guid sessionId)
  {
    if (chatResponse == null)
    {
      throw new NullReferenceException("chatResponse returned a null response");
    }

    if (sessionId == Guid.Empty)
    {
      throw new NullReferenceException("there must be provided sessionId");
    }

    return new Chat
    {
      chatUserId = chatResponse.chatUserId,
      chatReferenceId = Guid.NewGuid(),
      message = chatResponse.message,
      sessionId = sessionId,
      status = enums.Status.dummy1, 
      isBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };
  }
}
