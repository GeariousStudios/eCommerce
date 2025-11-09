using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Localization;

namespace backend.Services
{
    public class JsonDataAnnotationLocalizer : IStringLocalizer
    {
        private readonly ITranslationService _ts;
        private readonly IHttpContextAccessor _http;
        private static readonly Regex ExtendedPrefixRx = new(
            @"^\[(?<id>\d+)(?<pipes>(?:\|[^\]]+)*)\]\s*(?<key>.+)$",
            RegexOptions.Compiled
        );

        public JsonDataAnnotationLocalizer(ITranslationService ts, IHttpContextAccessor http)
        {
            _ts = ts;
            _http = http;
        }

        private string ResolveLang()
        {
            var header = _http.HttpContext?.Request?.Headers["X-User-Language"].ToString();
            if (header == "sv" || header == "en")
                return header!;
            return CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;
        }

        public LocalizedString this[string name]
        {
            get
            {
                var lang = ResolveLang();
                var m = ExtendedPrefixRx.Match(name);
                string messageKey = name;
                if (m.Success)
                    messageKey = m.Groups["key"].Value;
                var value = _ts.GetAsync(messageKey, lang).GetAwaiter().GetResult();
                return new LocalizedString(name, value, value == messageKey);
            }
        }
        public LocalizedString this[string name, params object[] arguments]
        {
            get
            {
                var lang = ResolveLang();
                var m = ExtendedPrefixRx.Match(name);
                string prefix = "";
                string messageKey = name;
                string? displayKey = null;
                var extraArgs = new List<object>();
                if (m.Success)
                {
                    var id = m.Groups["id"].Value;
                    prefix = $"[{id}]";
                    messageKey = m.Groups["key"].Value;
                    var pipes = m.Groups["pipes"].Value;
                    if (!string.IsNullOrEmpty(pipes))
                    {
                        var parts = pipes.Split('|', StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length > 0)
                        {
                            displayKey = parts[0];
                            for (int i = 1; i < parts.Length; i++)
                                extraArgs.Add(parts[i]);
                        }
                    }
                }
                var format = _ts.GetAsync(messageKey, lang).GetAwaiter().GetResult();
                object TranslateArg(object a)
                {
                    if (a is string s)
                    {
                        var ts = _ts.GetAsync(s, lang).GetAwaiter().GetResult();
                        return string.IsNullOrEmpty(ts) ? s : ts;
                    }
                    return a;
                }
                var finalArgsList = new List<object>();
                if (!string.IsNullOrEmpty(displayKey))
                {
                    var translatedDisplay = _ts.GetAsync(displayKey!, lang)
                        .GetAwaiter()
                        .GetResult();
                    finalArgsList.Add(translatedDisplay);
                }
                foreach (var ea in extraArgs)
                    finalArgsList.Add(TranslateArg(ea));
                if (arguments != null && arguments.Length > 0)
                {
                    foreach (var a in arguments)
                        finalArgsList.Add(TranslateArg(a));
                }
                var placeholders =
                    Regex
                        .Matches(format, @"\{\d+\}")
                        .Select(mm => int.Parse(mm.Value.Trim('{', '}')))
                        .DefaultIfEmpty(-1)
                        .Max() + 1;
                while (finalArgsList.Count < placeholders)
                    finalArgsList.Add(string.Empty);
                var value = string.Format(format, finalArgsList.ToArray());
                return new LocalizedString(name, $"{prefix} {value}".Trim(), format == messageKey);
            }
        }

        public IEnumerable<LocalizedString> GetAllStrings(bool includeParentCultures) =>
            Array.Empty<LocalizedString>();

        public IStringLocalizer WithCulture(CultureInfo culture) => this;
    }
}
