using System.Collections.Concurrent;
using Microsoft.AspNetCore.Hosting;

public interface ITranslationService
{
    Task<string> GetAsync(string key, string language = "sv");
}

public class TranslationService : ITranslationService
{
    private readonly string _root;
    private readonly ConcurrentDictionary<
        string,
        Task<IReadOnlyDictionary<string, string>>
    > _cache = new();

    public TranslationService(IWebHostEnvironment env)
    {
        _root = Path.Combine(env.ContentRootPath, "Translations");
    }

    public async Task<string> GetAsync(string key, string language = "sv")
    {
        var map = await LoadAsync(language);

        // Fallback till sv om valt språk saknas/helt tomt
        if (language != "sv" && map.Count == 0)
            map = await LoadAsync("sv");

        return map.TryGetValue(key, out var value) ? value : key;
    }

    private Task<IReadOnlyDictionary<string, string>> LoadAsync(string lang)
    {
        // Cachea Tasken
        return _cache.GetOrAdd(lang, LoadFileAsync);
    }

    private async Task<IReadOnlyDictionary<string, string>> LoadFileAsync(string lang)
    {
        var path = Path.Combine(_root, $"{lang}.json");
        if (!File.Exists(path))
            return new Dictionary<string, string>();

        var json = await File.ReadAllTextAsync(path);
        return System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(json)
            ?? new Dictionary<string, string>();
    }
}
