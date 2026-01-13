# AIWrapperService.Tests

Test project for AI Wrapper Service.

## Structure

```
AIWrapperService.Tests/
├── Unit/                          # Unit tests (isolated components)
│   ├── Services/                  # Service layer tests
│   ├── Middleware/                # Middleware tests
│   └── APIs/                      # API validation tests
│
├── Integration/                   # Integration tests (full HTTP flow)
│   ├── HealthCheckTests.cs
│   └── ChatApiAuthenticationTests.cs
│
├── Fixtures/                      # Test helpers and utilities
│   └── TestHelpers.cs
│
└── TestData/                      # Test data files (JSON, etc.)
```

## Running Tests

### Run All Tests
```bash
dotnet test
```

### Run Specific Category
```bash
# Unit tests only
dotnet test --filter "FullyQualifiedName~Unit"

# Integration tests only
dotnet test --filter "FullyQualifiedName~Integration"
```

### Watch Mode (Auto-run on file changes)
```bash
dotnet watch test
```

### With Code Coverage
```bash
dotnet test --collect:"XPlat Code Coverage"
```

### Verbose Output
```bash
dotnet test --logger "console;verbosity=detailed"
```

## Writing Tests

### Unit Test Example

```csharp
[Fact]
public async Task MyMethod_WithValidInput_ReturnsExpectedResult()
{
    // Arrange
    var mockHandler = TestHelpers.CreateMockHttpHandler();
    var service = new MyService(mockHandler.Object);

    // Act
    var result = await service.DoSomethingAsync();

    // Assert
    result.Should().NotBeNull();
    result.Value.Should().Be("expected");
}
```

### Integration Test Example

```csharp
public class MyIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MyIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Endpoint_ReturnsSuccess()
    {
        var response = await _client.GetAsync("/my-endpoint");
        response.Should().BeSuccessful();
    }
}
```

## Test Helpers

Use `TestHelpers` class for common test setup:

```csharp
// Create test configuration
var config = TestHelpers.CreateTestConfig();

// Create mock HTTP handler
var mockHandler = TestHelpers.CreateMockHttpHandler();

// Create test request
var request = TestHelpers.CreateTestChatRequest();
```

## Dependencies

- **xUnit**: Test framework
- **FluentAssertions**: Readable assertions
- **Moq**: Mocking framework
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing

## Best Practices

1. **Arrange-Act-Assert**: Structure all tests clearly
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: `Method_Scenario_ExpectedResult`
4. **Use test helpers**: Reduce duplication
5. **Mock external dependencies**: Unit tests should be isolated
6. **Integration tests for workflows**: Test full HTTP pipeline

## CI/CD

Tests run automatically on:
- Pull requests
- Commits to main branch
- Manual deployment trigger

All tests must pass before merge.
