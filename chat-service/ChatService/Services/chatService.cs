namespace ChatService.Services; 
using ChatService.APIs.Providers;
using ChatService.Interfaces;
using ChatService.DTOs;
using ChatService.entities; 
public class chatService: IChatService
{
  
 private readonly IChatAPIGatwayInterface _chatApiGatewayInterface; 
 private readonly ISessionService _sessionService;
 
 private readonly IChatWrapperClientInterface _chatWrapperClientInterface;

 private readonly IChatDatabaseProvider _chatdatbaseProvider; 

 public chatService(
     IChatAPIGatwayInterface chatAPIGatway,
     IChatWrapperClientInterface chatWrapperClientInterface,
     ISessionService sessionService,
     IChatDatabaseProvider chatDatabaseProvider){

   _sessionService = sessionService;
   _chatApiGatewayInterface = chatAPIGatway; 
   _chatWrapperClientInterface = chatWrapperClientInterface;
   _chatdatbaseProvider = chatDatabaseProvider;
 }



 public async Task<ChatResponse> SendChatMessageAsync(ChatRequest chatRequest){

   if(chatRequest == null){
     throw new NullReferenceException("chatRequest returned null response");
   }

   if(string.IsNullOrWhiteSpace(chatRequest.messageRequest)){
     throw new ArgumentException("Message cannot be empty");
   }

   Chat requestChatObject = CreateChatFromRequest(chatRequest);
 
   await _chatdatbaseProvider.createChatAsync(requestChatObject); 
   

   await _sessionService.CreateSession();

   ChatResponse chatResponse = await _chatWrapperClientInterface.getChatResponseAsync(chatRequest);

   Chat responseChatObject = CreateChatFromResponse(chatResponse); 
   await _chatdatbaseProvider.createChatAsync(responseChatObject); 
   
   return chatResponse;
  }

  public async Task<IReadOnlyList<Chat>> GetChatsAsync(Guid chatReferenceId){
    if(chatReferenceId == null || chatReferenceId == Guid.Empty){
      throw new ArgumentException("No chatReferenceId found");
    }

   return await _chatdatbaseProvider.getChatsAsync(chatReferenceId); 
  }

    private Chat CreateChatFromRequest(ChatRequest chatRequest){
     if(chatRequest == null){
       throw new NullReferenceException("chatResponse returned a null response");
     } 
      Chat newChat = new Chat{
        chatUserId = chatRequest.chatUserId,
        chatReferenceId = Guid.NewGuid(),
        message = chatRequest.messageRequest,
        status = enums.Status.dummy1, 
        isBookmarked = false,
        CreatedDate = DateTime.UtcNow
      };
     return newChat;
    }
    private Chat CreateChatFromResponse(ChatResponse chatResponse){
     if(chatResponse == null){
       throw new NullReferenceException("chatResponse returned a null response");
     } 
      Chat newChat = new Chat{
        chatUserId = chatResponse.chatUserId,
        chatReferenceId = Guid.NewGuid(),
        message = chatResponse.message,
        status = enums.Status.dummy1, 
        isBookmarked = false,
        CreatedDate = DateTime.UtcNow
      };
     return newChat;
    }
    public void BookmarkChats(Guid chatReferenceId){

    }
  }
  
