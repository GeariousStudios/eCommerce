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

        public NewsTypeController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
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

            int totalCount = await query.CountAsync();

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
            var newsType = await _context.NewsTypes.FindAsync(id);

            if (newsType == null)
            {
                return NotFound(new { message = "Nyhetstypen kunde inte hittas i databasen" });
            }

            var result = new NewsTypeDto { Id = newsType.Id, Name = newsType.Name };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNewsType(int id)
        {
            var newsType = await _context.NewsTypes.FindAsync(id);

            if (newsType == null)
            {
                return NotFound(new { message = "Nyhetstypen kunde inte hittas i databasen" });
            }

            _context.NewsTypes.Remove(newsType);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Nyhetstyp borttagen!" });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNewsType(CreateNewsTypeDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var existingNewsType = await _context.NewsTypes.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingNewsType != null)
            {
                return BadRequest(new { message = "Nyhetstyp med detta namn finns redan!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
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

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateNewsType(int id, UpdateNewsTypeDto dto)
        {
            var newsType = await _context.NewsTypes.FindAsync(id);

            if (newsType == null)
            {
                return NotFound(new { message = "Nyhetstypen kunde inte hittas i databasen" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var existingNewsType = await _context.UnitGroups.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (existingNewsType != null)
            {
                return BadRequest(new { message = "Nyhetstyp med detta namn finns redan!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

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

            return Ok(result);
        }
    }
}
