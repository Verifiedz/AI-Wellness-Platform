using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AIWrapperService.DTOs;
using AIWrapperService.Interfaces;

namespace AIWrapperService.Services;

public sealed class OpenAIChatService(HttpClient http, IConfiguration cfg) : IOpenAIChatService
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public async Task<ChatResponseDto> CompleteAsync(ChatRequestDto req, CancellationToken ct = default)
    {
        var baseUrl = cfg["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1/";
        var apiKey  = cfg["OpenAI:ApiKey"] ?? throw new InvalidOperationException("Missing OpenAI:ApiKey");

        http.BaseAddress = new Uri(baseUrl);
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            model = string.IsNullOrWhiteSpace(req.Model) ? "gpt-4o-mini" : req.Model,
            temperature = req.Temperature ?? 0.4,
            messages = req.Messages.Select(m => new { role = m.Role.ToString(), content = m.Content })
        };

        using var content = new StringContent(JsonSerializer.Serialize(payload, JsonOpts), Encoding.UTF8, "application/json");
        using var resp = await http.PostAsync("chat/completions", content, ct);
        resp.EnsureSuccessStatusCode();

        using var stream = await resp.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        var root = doc.RootElement;

        var reply = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        var usage = root.TryGetProperty("usage", out var u) ? u : default;
        var pTok  = usage.ValueKind != JsonValueKind.Undefined ? usage.GetProperty("prompt_tokens").GetInt32() : 0;
        var cTok  = usage.ValueKind != JsonValueKind.Undefined ? usage.GetProperty("completion_tokens").GetInt32() : 0;

        return new ChatResponseDto(req.SessionId, payload.model!, reply, pTok, cTok);
    }
}
