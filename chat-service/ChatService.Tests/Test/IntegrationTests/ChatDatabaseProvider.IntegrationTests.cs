
using System.Transactions;
using ChatService.APIs.Providers;
using ChatService.DTOs;
using ChatService.Enums;
using ChatService.Interfaces;
using ChatService.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ChatService.Test.IntegrationTests;

public class ChatDatabaseProviderIntegrationTests
{
    private readonly IChatDatabaseProvider _chatDatabaseProvider;


    public ChatDatabaseProviderIntegrationTests()
     {
       var stubconfigservice = new StubConfigurationService();


        _chatDatabaseProvider = new ChatDatabaseProvider(stubconfigservice, NullLogger<ChatDatabaseProvider>.Instance);
    }

    [Fact]
    public async Task CreateChatAsync_ShouldCreateAndReturnChat()
    {
        var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

        //Arrange the data
        var chat = new Chat
        {
            ChatUserId = Guid.NewGuid(),
            ChatReferenceId = Guid.NewGuid(),
            Message = "how are you sir?",
            Status = Status.Active,
            IsBookmarked = false,
            CreatedDate = DateTime.UtcNow,
        };

        //Act
         await _chatDatabaseProvider.CreateChatAsync(chat);

        var result = await _chatDatabaseProvider.GetChatAsync(chat.ChatReferenceId);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(chat.ChatUserId, result.ChatUserId);
        Assert.Equal(chat.ChatReferenceId, result.ChatReferenceId);
        Assert.Equal(chat.Message, result.Message);
        Assert.Equal(chat.Status, result.Status);
        Assert.Equal(chat.IsBookmarked, result.IsBookmarked);
    }
    [Fact]
    public async Task DeleteChatAsync()
    {

        var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
        var expected = new Chat
        {
            ChatUserId = Guid.NewGuid(),
            ChatReferenceId = Guid.NewGuid(),
            Message = "how are you sir?",
            Status = Status.Active,
            IsBookmarked = false,
            CreatedDate = DateTime.UtcNow,
        };

        // create a new entry chat
       await _chatDatabaseProvider.CreateChatAsync(expected);

        //delete the existence of the entry.
       await _chatDatabaseProvider.DeleteChatAsync(expected.ChatReferenceId);

        //attemp to recieve the entry
        var result =  await _chatDatabaseProvider.GetChatAsync(expected.ChatReferenceId);
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
    public string GetApiKey() => _stubchatServiceOptions.ApiKey;

    public string GetConnectionString() =>
        _stubchatServiceOptions.PostgreSqlConnectionString;

    public string GetBaseUrl()
    {
      return _stubchatServiceOptions.BaseUrl;
    }
}
