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

        if (language != "sv" && map.Count == 0)
            map = await LoadAsync("sv");

        return map.TryGetValue(key, out var value) ? value : key;
    }

    private Task<IReadOnlyDictionary<string, string>> LoadAsync(string lang)
    {
        return _cache.GetOrAdd(lang, LoadFileAsync);
    }

    private async Task<IReadOnlyDictionary<string, string>> LoadFileAsync(string lang)
    {
        var result = new Dictionary<string, string>();

        var files = new[]
        {
            Path.Combine(_root, $"{lang}.json"),
            Path.Combine(_root, $"annotations_{lang}.json"),
        };

        foreach (var file in files)
        {
            if (!File.Exists(file))
                continue;

            var json = await File.ReadAllTextAsync(file);
            var dict =
                System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(json)
                ?? new Dictionary<string, string>();

            foreach (var kv in dict)
                result[kv.Key] = kv.Value;
        }

        return result;
    }
}
