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
            @"^\[(\d+)(?:\|([^\]]+))?\]\s*(.+)$",
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
                    messageKey = m.Groups[3].Value;

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
                string displayKey = "";
                string messageKey = name;

                if (m.Success)
                {
                    prefix = $"[{m.Groups[1].Value}]";
                    displayKey = m.Groups[2].Value;
                    messageKey = m.Groups[3].Value;
                }

                var format = _ts.GetAsync(messageKey, lang).GetAwaiter().GetResult();

                object[] finalArgs;
                Func<object, object> translateArg = a =>
                {
                    if (a is string s)
                    {
                        var ts = _ts.GetAsync(s, lang).GetAwaiter().GetResult();
                        return string.IsNullOrEmpty(ts) ? s : ts;
                    }
                    return a;
                };

                if (!string.IsNullOrEmpty(displayKey))
                {
                    var translatedDisplay = _ts.GetAsync(displayKey, lang).GetAwaiter().GetResult();
                    var rest = (arguments ?? Array.Empty<object>()).Select(translateArg);
                    finalArgs = new object[] { translatedDisplay }
                        .Concat(rest)
                        .ToArray();
                }
                else
                {
                    finalArgs = (arguments ?? Array.Empty<object>()).Select(translateArg).ToArray();
                }

                var placeholders =
                    Regex
                        .Matches(format, @"\{\d+\}")
                        .Select(m => int.Parse(m.Value.Trim('{', '}')))
                        .DefaultIfEmpty(-1)
                        .Max() + 1;

                if (finalArgs.Length < placeholders)
                {
                    Array.Resize(ref finalArgs, placeholders);
                }

                var value = string.Format(format, finalArgs);
                return new LocalizedString(name, $"{prefix} {value}".Trim(), format == messageKey);
            }
        }

        public IEnumerable<LocalizedString> GetAllStrings(bool includeParentCultures) =>
            Array.Empty<LocalizedString>();

        public IStringLocalizer WithCulture(CultureInfo culture) => this;
    }
}
