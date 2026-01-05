using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using WellnessApp.NotificationService.Models;

namespace WellnessApp.NotificationService.Services
{
    public class WellnessTipService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<WellnessTipService> _logger;
        private const string TIPS_CACHE_KEY = "wellness_tips";
        private const string TIPS_FILE_PATH = "Data/wellness-tips.json";

        public WellnessTipService(IMemoryCache cache, ILogger<WellnessTipService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<string> GetRandomTipAsync()
        {
            try
            {
                var tips = await GetAllTipsAsync();

                if (tips == null || !tips.Any())
                {
                    _logger.LogWarning("No wellness tips available");
                    return "Remeber to take care of yourself today!";

                }

                var random = new Random();
                var selectedTip = tips[random.Next(tips.Count)];

                _logger.LogInformation("Selected tip ID: {TipId}", selectedTip.Id);
                return selectedTip.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting random tip");
                return "Remember to take care of yourself today!";
            }
        }

        private async Task<List<WellnessTip>> GetAllTipsAsync()
        {
            if (_cache.TryGetValue(TIPS_CACHE_KEY, out List<WellnessTip>? cachedTips))
            {
                _logger.LogInformation("Loaded tips from cache");
                return cachedTips ?? new List<WellnessTip>();
            }

            try
            {
                _logger.LogInformation("Loading tips from file: {FilePath}", TIPS_FILE_PATH);
                var jsonContent = await File.ReadAllTextAsync(TIPS_FILE_PATH);

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var tipsData = JsonSerializer.Deserialize<WellnessTipsData>(jsonContent, options);

                if (tipsData?.Tips != null)
                {
                    var cacheOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(24));
                    _cache.Set(TIPS_CACHE_KEY, tipsData.Tips, cacheOptions);

                    _logger.LogInformation("Loaded {Count} tips from file", tipsData.Tips.Count);
                    return tipsData.Tips;

                }

                _logger.LogWarning("Tips file parsed but no tips found");
                return new List<WellnessTip>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading tips from file");
                return new List<WellnessTip>();
            }
        }

        private class WellnessTipsData
        {
            public List<WellnessTip> Tips { get; set; } = new();
        }
    }
}
