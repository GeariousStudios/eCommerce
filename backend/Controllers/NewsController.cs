using backend.Data;
using backend.Dtos.News;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("news")]
    public class NewsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;

        public NewsController(AppDbContext context, UserService userService, ITranslationService t)
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

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateNewsItem(CreateNewsDto dto)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            if (dto.TypeId <= 0)
            {
                return BadRequest(new { message = await _t.GetAsync("News/ChooseType", lang) });
            }

            if (string.IsNullOrWhiteSpace(dto.Headline))
            {
                return BadRequest(
                    new { message = await _t.GetAsync("News/MissingHeadline", lang) }
                );
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = await _t.GetAsync("News/MissingContent", lang) });
            }

            var newsType = await _context.NewsTypes.FirstOrDefaultAsync(t => t.Id == dto.TypeId);

            if (newsType == null)
            {
                return BadRequest(new { message = await _t.GetAsync("NewsType/Invalid", lang) });
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var newsItem = new News
            {
                Date = dto.Date,
                TypeId = newsType.Id,
                TypeName = newsType.Name,
                Headline = dto.Headline,
                Content = dto.Content,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.News.Add(newsItem);
            await _context.SaveChangesAsync();

            var result = new NewsDto
            {
                Id = newsItem.Id,
                Date = newsItem.Date,
                TypeId = newsItem.TypeId,
                TypeName = newsItem.TypeName,
                Headline = newsItem.Headline,
                Content = newsItem.Content,

                // Meta data.
                CreationDate = newsItem.CreationDate,
                CreatedBy = newsItem.CreatedBy,
                UpdateDate = newsItem.UpdateDate,
                UpdatedBy = newsItem.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpGet("fetch")]
        public async Task<IActionResult> GetNews()
        {
            var news = await _context.News.OrderByDescending(n => n.Date).ToListAsync();

            return Ok(news);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetNewsItem(int id)
        {
            var lang = await GetLangAsync();
            var newsItem = await _context.News.FindAsync(id);

            if (newsItem == null)
            {
                return NotFound(new { message = await _t.GetAsync("News/NotFound", lang) });
            }

            return Ok(newsItem);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateNewsItem(int id, UpdateNewsDto dto)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var newsItem = await _context.News.FindAsync(id);
            if (newsItem == null)
            {
                return NotFound(new { message = await _t.GetAsync("News/NotFound", lang) });
            }

            if (dto.TypeId <= 0)
            {
                return BadRequest(new { message = await _t.GetAsync("News/ChooseType", lang) });
            }

            if (string.IsNullOrWhiteSpace(dto.Headline))
            {
                return BadRequest(
                    new { message = await _t.GetAsync("News/MissingHeadline", lang) }
                );
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = await _t.GetAsync("News/MissingContent", lang) });
            }

            var newsType = await _context.NewsTypes.FirstOrDefaultAsync(t => t.Id == dto.TypeId);

            if (newsType == null)
            {
                return BadRequest(new { message = await _t.GetAsync("NewsType/NotFound", lang) });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            newsItem.Date = dto.Date;
            newsItem.TypeId = newsType.Id;
            newsItem.TypeName = newsType.Name;
            newsItem.Headline = dto.Headline;
            newsItem.Content = dto.Content;

            // Meta data.
            newsItem.UpdateDate = now;
            newsItem.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new NewsDto
            {
                Id = newsItem.Id,
                Date = newsItem.Date,
                TypeId = newsItem.TypeId,
                TypeName = newsItem.TypeName,
                Headline = newsItem.Headline,
                Content = newsItem.Content,

                // Meta data.
                UpdateDate = newsItem.UpdateDate,
                UpdatedBy = newsItem.UpdatedBy,
            };

            return Ok(result);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteNewsItem(int id)
        {
            var lang = await GetLangAsync();
            var newsItem = await _context.News.FindAsync(id);

            if (newsItem == null)
            {
                return NotFound(new { message = await _t.GetAsync("News/NotFound", lang) });
            }

            _context.News.Remove(newsItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("News/Deleted", lang) });
        }
    }
}
