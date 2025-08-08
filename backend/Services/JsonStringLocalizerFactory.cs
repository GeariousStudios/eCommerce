using Microsoft.Extensions.Localization;

namespace backend.Services
{
    public class JsonStringLocalizerFactory : IStringLocalizerFactory
    {
        private readonly ITranslationService _ts;
        private readonly IHttpContextAccessor _http;

        public JsonStringLocalizerFactory(ITranslationService ts, IHttpContextAccessor http)
        {
            _ts = ts;
            _http = http;
        }

        public IStringLocalizer Create(Type resourceSource) =>
            new JsonDataAnnotationLocalizer(_ts, _http);

        public IStringLocalizer Create(string baseName, string location) =>
            new JsonDataAnnotationLocalizer(_ts, _http);
    }
}
