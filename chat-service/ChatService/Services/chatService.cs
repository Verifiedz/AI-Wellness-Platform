namespace ChatService.Services;
using System.Text.Json;
using ChatService.Interfaces;
using ChatService.DTOs;
using ChatService.entities;
public class chatService : IChatService
{
  private readonly ISessionService _sessionService;
  private readonly IChatWrapperClientInterface _chatWrapperClient;
  private readonly IChatDatabaseProvider _chatdatbaseProvider;
  private readonly Ganss.Xss.HtmlSanitizer _sanitizer;

  public chatService(
      IChatWrapperClientInterface chatWrapperClient,
      ISessionService sessionService,
      IChatDatabaseProvider chatDatabaseProvider,
      Ganss.Xss.HtmlSanitizer sanitizer)
  {
    _sessionService = sessionService;
    _chatWrapperClient = chatWrapperClient;
    _chatdatbaseProvider = chatDatabaseProvider;
    _sanitizer = sanitizer;
  }

  public async Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest, CancellationToken cancellationToken = default)
  {
    if (chatRequest == null)
    {
      throw new NullReferenceException("chatRequest returned null response");
    }

    if (string.IsNullOrWhiteSpace(chatRequest.messageRequest))
    {
      throw new ArgumentException("Message cannot be empty");
    }

    var safeMessage = _sanitizer.Sanitize(chatRequest.messageRequest);
    var sanitizedRequest = chatRequest with { messageRequest = safeMessage };

    bool isNewSession = !sanitizedRequest.sessionId.HasValue || sanitizedRequest.sessionId == Guid.Empty;
    var session = await _sessionService.GetOrCreateSessionAsync(sanitizedRequest.chatUserId, sanitizedRequest.sessionId);

    if (isNewSession)
    {
      var sessionName = ExtractSessionName(sanitizedRequest.messageRequest);
      await _sessionService.UpdateSessionNameAsync(session.sessionID, sessionName);
    }

    var previousMessages = await _chatdatbaseProvider.getChatsBySessionAsync(session.sessionID, 200, 0, cancellationToken);
    var history = previousMessages.Select((m, index) => new
    {
      role = index % 2 == 0 ? "user" : "assistant",
      content = m.message
    });
    var contextJson = JsonSerializer.Serialize(history);

    var updatedChatRequest = sanitizedRequest with { sessionId = session.sessionID, Context = contextJson };

    var requestChatObject = CreateChatFromRequest(updatedChatRequest, session.sessionID);
    await _chatdatbaseProvider.createChatAsync(requestChatObject, cancellationToken);

    var chatResponse = await _chatWrapperClient.getChatResponseAsync(updatedChatRequest, cancellationToken);
    var normalizedChatResponse = chatResponse with
    {
      sessionId = session.sessionID,
      chatUserId = sanitizedRequest.chatUserId
    };

    var responseChatObject = CreateChatFromResponse(normalizedChatResponse, session.sessionID);
    await _chatdatbaseProvider.createChatAsync(responseChatObject, cancellationToken);

    return normalizedChatResponse;
  }

  public async Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionId, Guid userId, int limit = 50, int offset = 0, CancellationToken cancellationToken = default)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("No chatReferenceId found");
    }

    var session = await _sessionService.GetOrCreateSessionAsync(userId, sessionId);
    return await _chatdatbaseProvider.getChatsBySessionAsync(session.sessionID, limit, offset, cancellationToken);
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
      status = enums.Status.Active,
      isBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };
  }

  private static string ExtractSessionName(string message, int maxWords = 6, int maxLength = 100)
  {
    var words = message.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
    var name = string.Join(" ", words.Take(maxWords));
    if (name.Length > maxLength)
      name = name[..maxLength];
    return name;
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
      status = enums.Status.Active,
      isBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };
  }
}
