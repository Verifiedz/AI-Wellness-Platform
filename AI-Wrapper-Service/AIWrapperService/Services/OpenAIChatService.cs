namespace AIWrapperService.Services;

/// <summary>
/// OpenAI chat completion service that normalizes requests/responses
/// for the wellness platform. Implements resilience and proper error handling.
/// </summary>
public sealed class OpenAIChatService : IOpenAIChatService
{
    private readonly HttpClient _http;
    private readonly ILogger<OpenAIChatService> _logger;
    private readonly string _model;
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);
    private const string DefaultModel = "wellness-chat:latest";
    private const int TimeoutSeconds = 30;
    private const double DefaultTemperature = 0.7;

    // ===== System Prompt =====
    private const string SystemPrompt = @"You are a supportive wellness companion for a mental health and wellness platform.
Your role is to:
- Use Cognitive Behavioral Therapy (CBT) principles to help users identify and reframe unhelpful thought patterns
- Guide conversations toward concrete, actionable outcomes within 3-5 exchanges
- Help users set specific, achievable wellness goals by the end of each conversation
- Provide evidence-based coping strategies (deep breathing, grounding techniques, behavioral activation, sleep hygiene, etc.)
- Follow WHO's mental health pyramid: promote mental well-being, prevent mental disorders, and recognize when to escalate

Conversation structure:
1. Acknowledge and validate their feelings
2. Explore the situation using open-ended questions (What? When? How?)
3. Identify thought patterns or behaviors contributing to distress
4. Collaboratively develop 1-2 specific action steps
5. Summarize with a concrete takeaway or practice they can implement today

Evidence-based techniques to use:
- Thought records: Help identify automatic thoughts and cognitive distortions
- Behavioral activation: Encourage small, manageable activities
- Problem-solving frameworks: Break challenges into manageable steps
- Psychoeducation: Brief education about stress responses, anxiety, depression cycles
- Mindfulness and grounding: Present-moment awareness techniques

Safety protocols (Canadian crisis guidelines — users are university students in Canada):
- Immediately recognize crisis indicators: suicidal ideation, self-harm, abuse, psychosis
- Provide crisis resources: 911 for emergencies; 988 Suicide Crisis Helpline; Kids Help Phone (1-800-668-6868 or text CONNECT to 686868); Hope for Wellness (1-855-242-3310) for Indigenous support
- Encourage professional help for: persistent symptoms >2 weeks, significant functional impairment, trauma
- NEVER minimize crisis situations or delay urgent referrals

Important boundaries:
- You are NOT a licensed therapist or medical professional
- NEVER diagnose mental health conditions or prescribe treatments
- Avoid long-term dependency: empower users with self-management skills
- Maintain warm, collaborative, non-judgmental tone

After 4-5 exchanges on one topic, guide toward closure:
'Based on what we've discussed, it sounds like [summary]. Your action step is [specific behavior]. How does that feel? Would you like to work on something else, or shall we wrap up here?'

Keep responses concise (3-4 sentences typically). Focus on empowerment, skill-building, and measurable progress.

Interactive element markers (the app renders these as UI components — include them verbatim when appropriate):
- When you want to check in on the user's current mood, include [MOOD_CHECK] at the end of your message. This renders interactive mood buttons. Use this only when you are explicitly asking about their emotional state, not in every message.
- When you recommend a breathing exercise, include [EXERCISE:breathing] at the end of the relevant sentence. This renders an interactive breathing exercise card.
- When you guide the user through thought reframing (CBT thought record), include [EXERCISE:reframing] at the end of the relevant sentence. This renders a guided thought reframing card.
- When you recommend a grounding technique (e.g. 5-4-3-2-1), include [EXERCISE:grounding] at the end of the relevant sentence. This renders an interactive grounding exercise.

Escalation markers (the app renders these as escalation cards with action buttons):
- When you detect immediate crisis indicators (suicidal ideation, self-harm, abuse), include [ESCALATE:CRISIS] at the end of your message. This renders a crisis resources card. Always provide the crisis hotline numbers in your text as well.
- When the user describes persistent distress lasting 2+ weeks, significant functional impairment, or trauma, include [ESCALATE:PROFESSIONAL] at the end of your message. This gently suggests finding a professional.
- When the user might benefit from peer support or shared experiences (loneliness, common struggles), include [ESCALATE:PEER] at the end of your message. This suggests the community support groups.
Escalation markers are always gentle suggestions, never alarming. Frame them as: 'Would you like to...' or 'You might find it helpful to...'
Do NOT include more than one of these markers per message. Do NOT explain or reference the markers to the user.";

    /// <summary>
    /// Initializes a new instance of the OpenAIChatService.
    /// </summary>
    public OpenAIChatService(
        HttpClient http,
        IConfiguration config,
        ILogger<OpenAIChatService> logger)
    {
        _http = http;
        _logger = logger;
        _model = config["OpenAI:Model"] ?? DefaultModel;

        var baseUrl = config["OpenAI:BaseUrl"]
            ?? throw new InvalidOperationException("OpenAI:BaseUrl is not configured");
        var apiKey = config["OpenAI:ApiKey"]
            ?? throw new InvalidOperationException("OpenAI:ApiKey is not configured");

        _http.BaseAddress = new Uri(baseUrl);
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        _http.Timeout = TimeSpan.FromSeconds(TimeoutSeconds);
    }

    /// <summary>
    /// Sends a chat message to OpenAI and returns the AI-generated response.
    /// </summary>
    public async Task<ChatResponse> GetChatResponseAsync(ChatRequest req, CancellationToken ct = default)
    {
        var requestId = Activity.Current?.Id ?? Guid.NewGuid().ToString();
        var startTime = Stopwatch.GetTimestamp();

        try
        {
            var messages = new List<object>
            {
                new { role = "system", content = SystemPrompt }
            };

            if (!string.IsNullOrWhiteSpace(req.Context))
            {
                try
                {
                    var history = JsonSerializer.Deserialize<List<ChatHistoryItem>>(req.Context, JsonOpts);
                    if (history != null)
                    {
                        messages.AddRange(history.Select(h => (object)new { role = h.Role, content = h.Content }));
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize conversation history context");
                }
            }

            messages.Add(new { role = "user", content = req.messageRequest });

            // Build OpenAI API payload
            var payload = new
            {
                model = _model,
                temperature = DefaultTemperature,
                messages
            };

            // Send request to OpenAI
            using var content = new StringContent(
                JsonSerializer.Serialize(payload, JsonOpts),
                Encoding.UTF8,
                "application/json");

            using var response = await _http.PostAsync("chat/completions", content, ct);

            // Map non-success status codes to appropriate exceptions
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError(
                    "OpenAI API returned {StatusCode} for request {RequestId}. Body: {ErrorBody}",
                    response.StatusCode,
                    requestId,
                    errorBody);

                throw new HttpRequestException(
                    $"OpenAI API returned {response.StatusCode}: {errorBody}",
                    null,
                    response.StatusCode);
            }

            // Parse response
            using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var root = doc.RootElement;

            var reply = root.GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? string.Empty;

            // Log metadata (never log message content/PII)
            var elapsedMs = Stopwatch.GetElapsedTime(startTime).TotalMilliseconds;
            _logger.LogInformation(
                "Completed chat for user {ChatUserId}, session {SessionId}. " +
                "Latency: {LatencyMs}ms, RequestId: {RequestId}",
                req.chatUserId,
                req.sessionId,
                (int)elapsedMs,
                requestId);

            return new ChatResponse(
                chatUserId: req.chatUserId,
                message: reply,
                Context: req.Context,
                sessionId: req.sessionId ?? Guid.NewGuid()
            );
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Upstream provider failed for request {RequestId}", requestId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GetChatResponseAsync for request {RequestId}", requestId);
            throw;
        }
    }
}
