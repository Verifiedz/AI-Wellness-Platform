namespace ChatService.Services; 
using ChatService.Interfaces;
public class chatService: IChatService
{
  
 private readonly IChatAPIGatwayInterface _chatApiGatewayInterface; 
 
 private readonly IChatWrapperClientInterface _chatWrapperClientInterface;

 public chatService(IChatAPIGatwayInterface chatAPIGatway,IChatWrapperClientInterface chatWrapperClientInterface){


   _chatApiGatewayInterface = chatAPIGatway; 
   _chatWrapperClientInterface = chatWrapperClientInterface; 
 }



 public void ExecuteChatService(){


  }

  public void ModifyChats(){

  }
 
}
