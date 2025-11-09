using backend.Data;
using backend.Dtos.NewsType;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("news-type")]
    public class NewsTypeController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public NewsTypeController(
            AppDbContext context,
            UserService userService,
            ITranslationService t,
            AuditTrailService audit
        )
        {
            _context = context;
            _userService = userService;
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
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<NewsType> query = _context.NewsTypes;

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(t => t.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.Name.ToLower())
                    : query.OrderBy(t => t.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.Id)
                    : query.OrderBy(t => t.Id),
            };

            var totalCount = await query.CountAsync();

            var newsTypes = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new NewsTypeDto
                {
                    Id = t.Id,
                    Name = t.Name,

                    // Meta data.
                    CreationDate = t.CreationDate,
                    CreatedBy = t.CreatedBy,
                    UpdateDate = t.UpdateDate,
                    UpdatedBy = t.UpdatedBy,
                })
                .ToListAsync();

            var result = new
            {
                totalCount,
                items = newsTypes,
                counts = new { },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetNewsType(int id)
        {
            var lang = await GetLangAsync();
            var newsType = await _context.NewsTypes.FindAsync(id);

            if (newsType == null)
            {
                return NotFound(new { message = await _t.GetAsync("NewsType/NotFound", lang) });
            }

            var result = new NewsTypeDto { Id = newsType.Id, Name = newsType.Name };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNewsType(int id)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (deletedBy, userId) = userInfo.Value;
            var newsType = await _context.NewsTypes.FindAsync(id);

            if (newsType == null)
            {
                return NotFound(new { message = await _t.GetAsync("NewsType/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "NewsType",
                newsType.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = newsType.Id,
                    ["Name"] = newsType.Name,
                }
            );

            _context.NewsTypes.Remove(newsType);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("NewsType/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNewsType(CreateNewsTypeDto dto)
        {
            var lang = await GetLangAsync();
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(
                    new { message = await _t.GetAsync("Common/ValidationError", lang), errors }
                );
            }

            var existingNewsType = await _context.NewsTypes.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingNewsType != null)
            {
                return BadRequest(new { message = await _t.GetAsync("NewsType/NameTaken", lang) });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var newsType = new NewsType
            {
                Name = dto.Name,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.NewsTypes.Add(newsType);
            await _context.SaveChangesAsync();

            var result = new NewsTypeDto
            {
                Name = newsType.Name,

                // Meta data.
                CreationDate = newsType.CreationDate,
                CreatedBy = newsType.CreatedBy,
                UpdateDate = newsType.UpdateDate,
                UpdatedBy = newsType.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "NewsType",
                newsType.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = newsType.Id,
                    ["Name"] = newsType.Name,
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateNewsType(int id, UpdateNewsTypeDto dto)
        {
            var lang = await GetLangAsync();
            var newsType = await _context.NewsTypes.FindAsync(id);

            if (newsType == null)
            {
                return NotFound(new { message = await _t.GetAsync("NewsType/NotFound", lang) });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(
                    new { message = await _t.GetAsync("Common/ValidationError", lang), errors }
                );
            }

            var existingNewsType = await _context.NewsTypes.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (existingNewsType != null)
            {
                return BadRequest(new { message = await _t.GetAsync("NewsType/NameTaken", lang) });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = newsType.Id,
                ["Name"] = newsType.Name,
            };

            newsType.Name = dto.Name;

            // Meta data.
            newsType.UpdateDate = now;
            newsType.UpdatedBy = updatedBy;

            var relatedNews = await _context.News.Where(n => n.TypeId == newsType.Id).ToListAsync();

            foreach (var news in relatedNews)
            {
                news.TypeName = dto.Name;
            }

            await _context.SaveChangesAsync();

            var result = new NewsTypeDto
            {
                Id = newsType.Id,
                Name = newsType.Name,

                // Meta data.
                UpdateDate = newsType.UpdateDate,
                UpdatedBy = newsType.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "NewsType",
                newsType.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = newsType.Id,
                        ["Name"] = newsType.Name,
                    },
                }
            );

            return Ok(result);
        }
    }
}
