using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("user-preferences")]
    public class UserPreferencesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserPreferencesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPreferences()
        {
            var username = User.Identity?.Name;

            if (username == null)
            {
                return Unauthorized();
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound();
            }

            return Ok(
                new
                {
                    theme = user.UserPreferences.Theme,
                    isGridView = user.UserPreferences.IsGridView,
                }
            );
        }

        [HttpPut("theme")]
        public async Task<IActionResult> UpdateTheme([FromBody] UpdateThemeRequest req)
        {
            var username = User.Identity?.Name;
            var theme = req.Theme;

            if (username == null)
            {
                return Unauthorized();
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound();
            }

            if (theme != "light" && theme != "dark")
            {
                return BadRequest(new { error = "Ogiltigt tema" });
            }

            user.UserPreferences.Theme = theme;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Temat uppdaterades!" });
        }

        [HttpPut("view")]
        public async Task<IActionResult> UpdateViewPreference(
            [FromBody] UpdateViewPreferenceRequest req
        )
        {
            var username = User.Identity?.Name;
            var isGridView = req.IsGridView;

            if (username == null)
            {
                return Unauthorized();
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user?.UserPreferences == null)
            {
                return NotFound();
            }

            user.UserPreferences.IsGridView = isGridView;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Vy-preferens uppdaterades!" });
        }
    }
}

public class UpdateThemeRequest
{
    public required string Theme { get; set; }
}

public class UpdateViewPreferenceRequest
{
    public required bool IsGridView { get; set; }
}
