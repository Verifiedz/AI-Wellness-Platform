
using System.Formats.Tar;
using System.Transactions;
using ChatService.APIs.Providers;
using ChatService.DTOs;
using ChatService.Interfaces;
using ChatService.Services;
using Xunit;

namespace ChatService.Test.IntegrationTests;

public class ChatDatabaseProviderIntegrationTests
{
    private readonly IChatDatabaseProvider _chatDatabaseProvider;
    

    public ChatDatabaseProviderIntegrationTests()
     {
       var stubconfigservice = new StubConfigurationService();

       
        _chatDatabaseProvider = new ChatDatabaseProvider(stubconfigservice);
    }

    [Fact]
    public async Task CreateChatAsync_ShouldCreateAndReturnChat()
    {
        var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        //Arrange the data
        var chat = new Chat
        {
            chatUserId = Guid.NewGuid(),
            chatReferenceId = Guid.NewGuid(),
            message = "how are you sir?",
            status = enums.Status.dummy1,
            isBookmarked = false,
            CreatedDate = DateTime.UtcNow,
        };

        //Act
         await _chatDatabaseProvider.createChatAsync(chat);

        var result = await _chatDatabaseProvider.getChatAsync(chat.chatReferenceId);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(chat.chatUserId, result.chatUserId);
        Assert.Equal(chat.chatReferenceId, result.chatReferenceId);
        Assert.Equal(chat.message, result.message);
        Assert.Equal(chat.status, result.status);
        Assert.Equal(chat.isBookmarked, result.isBookmarked);
    }
    [Fact]
    public async Task DeleteChatAsync()
    {

        var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
        var expected = new Chat
        {
            chatUserId = Guid.NewGuid(),
            chatReferenceId = Guid.NewGuid(),
            message = "how are you sir?",
            status = enums.Status.dummy1,
            isBookmarked = false,
            CreatedDate = DateTime.UtcNow,
        };

        // create a new entry chat 
       await _chatDatabaseProvider.createChatAsync(expected);

        //delete the existence of the entry.
       await _chatDatabaseProvider.deleteChatAsync(expected.chatReferenceId);

        //attemp to recieve the entry
        var result =  await _chatDatabaseProvider.getChatAsync(expected.chatReferenceId);
        Assert.Null(result); 
    }

}
public class StubConfigurationService : IConfigurationService
{
    private readonly ChatServiceOptions _stubchatServiceOptions;
    public StubConfigurationService() {
        _stubchatServiceOptions = new ChatServiceOptions
        {
            PostgreSqlConnectionString = "Server=localhost;Port=5432;Database=chatservicedb;User Id=wasim;Password=Wasim1921;Pooling=true;"
        };
    }
    public string getApiKey() => _stubchatServiceOptions.ApiKey;

    public string getConnectionString() =>
        _stubchatServiceOptions.PostgreSqlConnectionString;

    public string getBaseUrl(){
      return _stubchatServiceOptions.BaseUrl;

    }
}
