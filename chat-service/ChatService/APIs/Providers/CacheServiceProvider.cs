using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using ChatService.Interfaces;

namespace ChatService.Services;

public class CacheServiceProvider : ICacheServiceProvider
{
    private readonly IDistributedCache _cache;

    public CacheServiceProvider(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var jsonData = await _cache.GetStringAsync(key);
        
        if (jsonData is null) 
            return default;

        return JsonSerializer.Deserialize<T>(jsonData);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpireTime = null)
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = absoluteExpireTime ?? TimeSpan.FromMinutes(30)
        };

        var jsonData = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, jsonData, options);
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }
}
