using backend.Data;
using backend.Dtos.User;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("user-favourites")]
    public class UserFavouritesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;

        public UserFavouritesController(
            AppDbContext context,
            UserService userService,
            ITranslationService t
        )
        {
            _context = context;
            _userService = userService;
            _t = t;
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
        public async Task<IActionResult> GetFavourites()
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (_, userId) = userInfo.Value;

            var items = await _context
                .UserFavourites.Where(f => f.UserId == userId)
                .OrderBy(f => f.Order)
                .Select(f => new FavouriteItemDto
                {
                    Href = f.Href,
                    Order = f.Order,
                    Label = f.Label,
                    Icon = f.Icon,
                })
                .ToListAsync();

            return Ok(new FavouritesDto { Items = items });
        }

        [HttpPost]
        public async Task<IActionResult> AddFavourite([FromBody] FavouriteRequest request)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (_, userId) = userInfo.Value;

            var href = request.Href?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(href))
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Common/InvalidRequest", lang) }
                );
            }

            var exists = await _context.UserFavourites.AnyAsync(f =>
                f.UserId == userId && f.Href == href
            );

            if (!exists)
            {
                var next =
                    (
                        await _context
                            .UserFavourites.Where(f => f.UserId == userId)
                            .Select(f => (int?)f.Order)
                            .MaxAsync()
                    ) ?? -1;

                _context.UserFavourites.Add(
                    new UserFavourite
                    {
                        UserId = userId,
                        Href = href,
                        Label = request.Label,
                        Icon = request.Icon,
                        Order = next + 1,
                    }
                );
                await _context.SaveChangesAsync();
            }

            return Ok(new { href });
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveFavourite([FromBody] FavouriteRequest request)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (_, userId) = userInfo.Value;
            var href = request.Href?.Trim() ?? "";

            if (string.IsNullOrWhiteSpace(href))
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Common/InvalidRequest", lang) }
                );
            }

            var fav = await _context.UserFavourites.FirstOrDefaultAsync(f =>
                f.UserId == userId && f.Href == href
            );

            if (fav == null)
            {
                return Ok();
            }

            _context.UserFavourites.Remove(fav);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPut]
        public async Task<IActionResult> ReorderFavourites([FromBody] FavouritesDto dto)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (_, userId) = userInfo.Value;

            var list = await _context.UserFavourites.Where(f => f.UserId == userId).ToListAsync();
            var dict = list.ToDictionary(f => f.Href);

            foreach (var item in dto.Items)
            {
                if (dict.TryGetValue(item.Href, out var fav))
                {
                    fav.Order = item.Order;
                }
            }

            await _context.SaveChangesAsync();

            return Ok();
        }
    }

    public class FavouriteRequest
    {
        public string Href { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
    }
}
