namespace JournalService.Tests.Services;

using FluentAssertions;
using Ganss.Xss;
using JournalService.Api.Models.Entities;
using JournalService.Api.Models.Requests;
using JournalService.Api.Services;
using Microsoft.Extensions.Logging;
using Moq;

public class JournalEntryServiceTests
{
    private readonly Mock<IDatabaseService> _dbMock;
    private readonly Mock<ILogger<JournalEntryService>> _loggerMock;
    private readonly HtmlSanitizer _sanitizer;
    private readonly JournalEntryService _sut;

    public JournalEntryServiceTests()
    {
        _dbMock = new Mock<IDatabaseService>();
        _loggerMock = new Mock<ILogger<JournalEntryService>>();
        _sanitizer = new HtmlSanitizer();
        _sanitizer.AllowedTags.Clear();
        _sanitizer.AllowedAttributes.Clear();
        _sut = new JournalEntryService(_dbMock.Object, _loggerMock.Object, _sanitizer);
    }

    // ------------------------------------------------------------------ //
    // CreateEntryAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task CreateEntryAsync_WithValidData_CallsDatabaseAndReturnsResponse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateJournalEntryRequest
        {
            Mood = "good",
            Emotions = ["Happy", "Grateful"],
            EnergyLevel = 7,
            Content = "Today was a great day.",
            EntryDate = DateOnly.FromDateTime(DateTime.Today)
        };

        var storedEntry = new JournalEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Mood = request.Mood,
            Emotions = request.Emotions,
            EnergyLevel = request.EnergyLevel,
            Content = request.Content,
            EntryDate = request.EntryDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // No existing entry for this date
        _dbMock.Setup(db => db.GetJournalEntryByDateAsync(userId, request.EntryDate))
               .ReturnsAsync((JournalEntry?)null);

        _dbMock.Setup(db => db.CreateJournalEntryAsync(
                userId, request.Mood, request.Emotions, request.EnergyLevel,
                request.Content, request.EntryDate))
               .ReturnsAsync(storedEntry);

        // Act
        var result = await _sut.CreateEntryAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(userId);
        result.Mood.Should().Be("good");
        result.EnergyLevel.Should().Be(7);
        result.Content.Should().Be("Today was a great day.");

        _dbMock.Verify(db => db.CreateJournalEntryAsync(
            userId, request.Mood, request.Emotions, request.EnergyLevel,
            request.Content, request.EntryDate), Times.Once);
    }

    [Fact]
    public async Task CreateEntryAsync_WhenEntryAlreadyExistsForDate_ThrowsArgumentException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var date = DateOnly.FromDateTime(DateTime.Today);
        var request = new CreateJournalEntryRequest
        {
            Mood = "okay",
            Emotions = ["Content"],
            EnergyLevel = 5,
            Content = "Another entry.",
            EntryDate = date
        };

        var existingEntry = new JournalEntry { Id = Guid.NewGuid(), UserId = userId, EntryDate = date };
        _dbMock.Setup(db => db.GetJournalEntryByDateAsync(userId, date))
               .ReturnsAsync(existingEntry);

        // Act & Assert
        await _sut.Invoking(s => s.CreateEntryAsync(userId, request))
                  .Should().ThrowAsync<ArgumentException>()
                  .WithMessage("*already exists*");
    }

    [Fact]
    public async Task CreateEntryAsync_WithInvalidEmotion_ThrowsArgumentException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateJournalEntryRequest
        {
            Mood = "good",
            Emotions = ["InvalidEmotion"],
            EnergyLevel = 5,
            Content = "Test.",
            EntryDate = DateOnly.FromDateTime(DateTime.Today)
        };

        // Act & Assert
        await _sut.Invoking(s => s.CreateEntryAsync(userId, request))
                  .Should().ThrowAsync<ArgumentException>()
                  .WithMessage("*Invalid emotions*");

        _dbMock.Verify(db => db.CreateJournalEntryAsync(
            It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string[]>(),
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<DateOnly>()), Times.Never);
    }

    // ------------------------------------------------------------------ //
    // GetEntriesAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetEntriesAsync_ReturnsListFromDatabase()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entries = new List<JournalEntry>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, Mood = "great", Emotions = ["Happy"],
                    EnergyLevel = 9, Content = "Day 1", EntryDate = new DateOnly(2025, 1, 1),
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), UserId = userId, Mood = "good", Emotions = ["Content"],
                    EnergyLevel = 7, Content = "Day 2", EntryDate = new DateOnly(2025, 1, 2),
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _dbMock.Setup(db => db.GetJournalEntriesByUserAsync(userId, null, null, 50, 0))
               .ReturnsAsync(entries);

        // Act
        var result = await _sut.GetEntriesAsync(userId);

        // Assert
        result.Should().HaveCount(2);
        result[0].Mood.Should().Be("great");
        result[1].Mood.Should().Be("good");
    }

    [Fact]
    public async Task GetEntriesAsync_WithNoEntries_ReturnsEmptyList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _dbMock.Setup(db => db.GetJournalEntriesByUserAsync(userId, null, null, 50, 0))
               .ReturnsAsync([]);

        // Act
        var result = await _sut.GetEntriesAsync(userId);

        // Assert
        result.Should().BeEmpty();
    }

    // ------------------------------------------------------------------ //
    // GetEntryByIdAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetEntryByIdAsync_WithExistingId_ReturnsMappedResponse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entryId = Guid.NewGuid();
        var entry = new JournalEntry
        {
            Id = entryId,
            UserId = userId,
            Mood = "okay",
            Emotions = ["Peaceful"],
            EnergyLevel = 6,
            Content = "Quiet day.",
            EntryDate = new DateOnly(2025, 3, 15),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbMock.Setup(db => db.GetJournalEntryByIdAsync(entryId, userId))
               .ReturnsAsync(entry);

        // Act
        var result = await _sut.GetEntryByIdAsync(entryId, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(entryId);
        result.Mood.Should().Be("okay");
    }

    [Fact]
    public async Task GetEntryByIdAsync_WithNonExistentId_ReturnsNull()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entryId = Guid.NewGuid();

        _dbMock.Setup(db => db.GetJournalEntryByIdAsync(entryId, userId))
               .ReturnsAsync((JournalEntry?)null);

        // Act
        var result = await _sut.GetEntryByIdAsync(entryId, userId);

        // Assert
        result.Should().BeNull();
    }

    // ------------------------------------------------------------------ //
    // DeleteEntryAsync
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task DeleteEntryAsync_WhenEntryExists_ReturnsTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entryId = Guid.NewGuid();

        _dbMock.Setup(db => db.DeleteJournalEntryAsync(entryId, userId))
               .ReturnsAsync(true);

        // Act
        var result = await _sut.DeleteEntryAsync(entryId, userId);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteEntryAsync_WhenEntryDoesNotBelongToUser_ReturnsFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entryId = Guid.NewGuid();

        _dbMock.Setup(db => db.DeleteJournalEntryAsync(entryId, userId))
               .ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteEntryAsync(entryId, userId);

        // Assert
        result.Should().BeFalse();
    }

    // ------------------------------------------------------------------ //
    // HTML Sanitization
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task CreateEntryAsync_SanitizesHtmlContent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateJournalEntryRequest
        {
            Mood = "okay",
            Emotions = ["Happy"],
            EnergyLevel = 5,
            Content = "<script>alert('xss')</script>Safe text",
            EntryDate = DateOnly.FromDateTime(DateTime.Today)
        };

        _dbMock.Setup(db => db.GetJournalEntryByDateAsync(userId, request.EntryDate))
               .ReturnsAsync((JournalEntry?)null);

        string? capturedContent = null;
        _dbMock.Setup(db => db.CreateJournalEntryAsync(
                userId, request.Mood, request.Emotions, request.EnergyLevel,
                It.IsAny<string>(), request.EntryDate))
               .Callback<Guid, string, string[], int, string, DateOnly>(
                   (_, _, _, _, content, _) => capturedContent = content)
               .ReturnsAsync(new JournalEntry
               {
                   Id = Guid.NewGuid(), UserId = userId, Mood = "okay",
                   Emotions = ["Happy"], EnergyLevel = 5, Content = "Safe text",
                   EntryDate = request.EntryDate, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
               });

        // Act
        await _sut.CreateEntryAsync(userId, request);

        // Assert
        capturedContent.Should().NotBeNull();
        capturedContent!.Should().NotContain("<script>");
        capturedContent.Should().Contain("Safe text");
    }

    [Fact]
    public async Task UpdateEntryAsync_SanitizesHtmlContent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var entryId = Guid.NewGuid();
        var request = new UpdateJournalEntryRequest
        {
            Mood = "good",
            Emotions = ["Peaceful"],
            EnergyLevel = 6,
            Content = "<img src=x onerror=alert(1)>Safe update"
        };

        string? capturedContent = null;
        _dbMock.Setup(db => db.UpdateJournalEntryAsync(
                entryId, userId, request.Mood, request.Emotions, request.EnergyLevel,
                It.IsAny<string>()))
               .Callback<Guid, Guid, string, string[], int, string>(
                   (_, _, _, _, _, content) => capturedContent = content)
               .ReturnsAsync(new JournalEntry
               {
                   Id = entryId, UserId = userId, Mood = "good",
                   Emotions = ["Peaceful"], EnergyLevel = 6, Content = "Safe update",
                   EntryDate = new DateOnly(2025, 1, 1), CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
               });

        // Act
        await _sut.UpdateEntryAsync(entryId, userId, request);

        // Assert
        capturedContent.Should().NotBeNull();
        capturedContent!.Should().NotContain("<img");
        capturedContent.Should().Contain("Safe update");
    }
}
