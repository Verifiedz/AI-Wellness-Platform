namespace ChatService.Services;
using ChatService.APIs.Providers;
using ChatService.Interfaces;
using ChatService.DTOs;
using ChatService.entities; 
public class chatService:IChatService

{
  
 private readonly ISessionService _sessionService;
 
 private readonly IChatWrapperClientInterface _chatWrapperClient;

 private readonly IChatDatabaseProvider _chatdatbaseProvider; 

 public chatService(
     IChatWrapperClientInterface chatWrapperClient,
     ISessionService sessionService,
     IChatDatabaseProvider chatDatabaseProvider){

   _sessionService = sessionService;
   _chatWrapperClient= chatWrapperClient;
   _chatdatbaseProvider = chatDatabaseProvider;
 }



 public async Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest){

   if(chatRequest == null){
     throw new NullReferenceException("chatRequest returned null response");
   }

   if(string.IsNullOrWhiteSpace(chatRequest.messageRequest)){
     throw new ArgumentException("Message cannot be empty");
   }



   var session = await _sessionService.GetOrCreateSessionAsync(chatRequest.chatUserId, chatRequest.sessionId);
   

   var updatedChatRequest = chatRequest with {sessionId = session.sessionID};

   Chat requestChatObject = CreateChatFromRequest(updatedChatRequest, session.sessionID);
 
   await _chatdatbaseProvider.createChatAsync(requestChatObject); 
   


   ChatResponse chatResponse = await _chatWrapperClient.getChatResponseAsync(updatedChatRequest);

   Chat responseChatObject = CreateChatFromResponse(chatResponse, session.sessionID); 
   await _chatdatbaseProvider.createChatAsync(responseChatObject); 
   
   return chatResponse;
  }

  public async Task<IReadOnlyList<Chat>> GetChatsbySessionAsync(Guid sessionID, Guid UserId){
    if(sessionID == Guid.Empty){
      throw new ArgumentException("No chatReferenceId found");
    }

    var session = await _sessionService.GetOrCreateSessionAsync(UserId, sessionID);

    var chatCollectionBySession = await _chatdatbaseProvider.getChatsBySessionAsync(sessionID);

    return chatCollectionBySession;
  }
   public async void BookmarkChat(Guid sessionID){
     if(sessionID == Guid.Empty){
      throw new ArgumentException("No chatReferenceId found");
     }
    // await _chatdatbaseProvider.setIsBookmarkedAsync(sessionID);
    } 

    private Chat CreateChatFromRequest(ChatRequest chatRequest, Guid sessionId){
     if(chatRequest == null){
       throw new NullReferenceException("chatResponse returned a null response");
     } 
      Chat newChat = new Chat{
        chatUserId = chatRequest.chatUserId,
        chatReferenceId = Guid.NewGuid(),
        message = chatRequest.messageRequest,
        sessionId = sessionId,
        status = enums.Status.dummy1, 
        isBookmarked = false,
        CreatedDate = DateTime.UtcNow
      };
     return newChat;
    }
    private Chat CreateChatFromResponse(ChatResponse chatResponse, Guid sessionId){
     if(chatResponse == null){
       throw new NullReferenceException("chatResponse returned a null response");
     } 
     if(sessionId == Guid.Empty){
       throw new NullReferenceException("there must be provided sessionId");
     }
      Chat newChat = new Chat{
        chatUserId = chatResponse.chatUserId,
        chatReferenceId = Guid.NewGuid(),
        message = chatResponse.message,
        sessionId = sessionId,
        status = enums.Status.dummy1, 
        isBookmarked = false,
        CreatedDate = DateTime.UtcNow
      };
     return newChat;
    }
 
}
