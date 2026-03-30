using System.Text.Json;
using ChatService.Interfaces;
using ChatService.DTOs;
using ChatService.Entities;
using ChatService.Enums;

namespace ChatService.Services;

public class ChatService : IChatService
{
  private readonly ISessionService _sessionService;
  private readonly IChatWrapperClientInterface _chatWrapperClient;
  private readonly IChatDatabaseProvider _chatdatbaseProvider;
  private readonly Ganss.Xss.HtmlSanitizer _sanitizer;

  public ChatService(
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
      await _sessionService.UpdateSessionNameAsync(session.SessionId, sessionName);
    }

    var previousMessages = await _chatdatbaseProvider.GetChatsBySessionAsync(session.SessionId, 200, 0, cancellationToken);
    var history = previousMessages.Select((m, index) => new
    {
      role = index % 2 == 0 ? "user" : "assistant",
      content = m.Message
    });
    var contextJson = JsonSerializer.Serialize(history);

    var updatedChatRequest = sanitizedRequest with { sessionId = session.SessionId, Context = contextJson };

    var requestChatObject = CreateChatFromRequest(updatedChatRequest, session.SessionId);
    await _chatdatbaseProvider.CreateChatAsync(requestChatObject, cancellationToken);

    var chatResponse = await _chatWrapperClient.GetChatResponseAsync(updatedChatRequest, cancellationToken);
    var normalizedChatResponse = chatResponse with
    {
      sessionId = session.SessionId,
      chatUserId = sanitizedRequest.chatUserId
    };

    var responseChatObject = CreateChatFromResponse(normalizedChatResponse, session.SessionId);
    await _chatdatbaseProvider.CreateChatAsync(responseChatObject, cancellationToken);

    return normalizedChatResponse;
  }

  public async Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionId, Guid userId, int limit = 50, int offset = 0, CancellationToken cancellationToken = default)
  {
    if (sessionId == Guid.Empty)
    {
      throw new ArgumentException("No chatReferenceId found");
    }

    var session = await _sessionService.GetOrCreateSessionAsync(userId, sessionId);
    return await _chatdatbaseProvider.GetChatsBySessionAsync(session.SessionId, limit, offset, cancellationToken);
  }

  private Chat CreateChatFromRequest(ChatRequest chatRequest, Guid sessionId)
  {
    if (chatRequest == null)
    {
      throw new NullReferenceException("chatResponse returned a null response");
    }

    return new Chat
    {
      ChatUserId = chatRequest.chatUserId,
      ChatReferenceId = Guid.NewGuid(),
      Message = chatRequest.messageRequest,
      SessionId = sessionId,
      Status = Status.Active,
      IsBookmarked = false,
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
      ChatUserId = chatResponse.chatUserId,
      ChatReferenceId = Guid.NewGuid(),
      Message = chatResponse.message,
      SessionId = sessionId,
      Status = Status.Active,
      IsBookmarked = false,
      CreatedDate = DateTime.UtcNow
    };
  }
}
