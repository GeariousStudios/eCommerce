using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("user-preferences")]
    public class UserPreferencesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public UserPreferencesController(
            AppDbContext context,
            ITranslationService t,
            AuditTrailService audit
        )
        {
            _context = context;
            _t = t;
            _audit = audit;
        }

        private async Task<string> GetLangAsync()
        {
            var username = User.Identity?.Name;
            if (!string.IsNullOrEmpty(username))
            {
                var lang = await _context
                    .Users.Where(u => u.Username == username)
                    .Select(u => u.UserPreferences!.Language)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrWhiteSpace(lang))
                    return lang!;
            }

            var headerLang = Request.Headers["X-User-Language"].ToString();
            if (headerLang == "sv" || headerLang == "en")
                return headerLang;

            return "sv";
        }

        [HttpGet]
        public async Task<IActionResult> GetPreferences()
        {
            var lang = await GetLangAsync();
            var username = User.Identity?.Name;

            if (username == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound(new { message = await _t.GetAsync("UserPrefs/NotFound", lang) });
            }

            return Ok(
                new
                {
                    theme = user.UserPreferences.Theme,
                    language = user.UserPreferences.Language,
                    isGridView = user.UserPreferences.IsGridView,
                }
            );
        }

        [HttpPut("theme")]
        public async Task<IActionResult> UpdateTheme([FromBody] UpdateThemeRequest req)
        {
            var lang = await GetLangAsync();
            var username = User.Identity?.Name;
            var theme = req.Theme;

            if (username == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound(new { message = await _t.GetAsync("UserPrefs/NotFound", lang) });
            }

            if (theme != "light" && theme != "dark")
            {
                return BadRequest(
                    new { error = await _t.GetAsync("UserPrefs/ThemeInvalid", lang) }
                );
            }

            user.UserPreferences.Theme = theme;
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("UserPrefs/ThemeUpdated", lang) });
        }

        [HttpPut("language")]
        public async Task<IActionResult> UpdateLanguage([FromBody] UpdateLanguageRequest req)
        {
            var lang = await GetLangAsync();
            var username = User.Identity?.Name;
            var language = req.Language;

            if (username == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound(new { message = await _t.GetAsync("UserPrefs/NotFound", lang) });
            }

            if (language != "sv" && language != "en")
            {
                return BadRequest(
                    new { error = await _t.GetAsync("UserPrefs/LanguageInvalid", lang) }
                );
            }

            user.UserPreferences.Language = language;
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("UserPrefs/LanguageUpdated", lang) });
        }

        [HttpPut("view")]
        public async Task<IActionResult> UpdateViewPreference(
            [FromBody] UpdateViewPreferenceRequest req
        )
        {
            var lang = await GetLangAsync();
            var username = User.Identity?.Name;
            var isGridView = req.IsGridView;

            if (username == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound(new { message = await _t.GetAsync("UserPrefs/NotFound", lang) });
            }

            user.UserPreferences.IsGridView = isGridView;
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("UserPrefs/ViewUpdated", lang) });
        }
    }
}

public class UpdateThemeRequest
{
    public required string Theme { get; set; }
}

public class UpdateLanguageRequest
{
    public required string Language { get; set; }
}

public class UpdateViewPreferenceRequest
{
    public required bool IsGridView { get; set; }
}
