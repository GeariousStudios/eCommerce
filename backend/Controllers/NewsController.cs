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

        public NewsController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateNewsItem(CreateNewsDto dto)
        {
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            if (dto.TypeId <= 0)
            {
                return BadRequest(new { message = "Välj nyhetstyp" });
            }

            if (string.IsNullOrWhiteSpace(dto.Headline))
            {
                return BadRequest(new { message = "Fyll i rubrik" });
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = "Fyll i innehåll" });
            }

            var newsType = await _context.NewsTypes.FirstOrDefaultAsync(t => t.Id == dto.TypeId);

            if (newsType == null)
            {
                return BadRequest(new { message = "Ogiltig nyhetstyp" });
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
            var newsItem = await _context.News.FindAsync(id);

            if (newsItem == null)
            {
                return NotFound(new { message = "Nyheten kunde inte hittas i databasen" });
            }

            return Ok(newsItem);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateNewsItem(int id, UpdateNewsDto dto)
        {
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var newsItem = await _context.News.FindAsync(id);
            if (newsItem == null)
            {
                return NotFound(new { message = "Nyheten kunde inte hittas i databasen" });
            }

            if (dto.TypeId <= 0)
            {
                return BadRequest(new { message = "Välj nyhetstyp" });
            }

            if (string.IsNullOrWhiteSpace(dto.Headline))
            {
                return BadRequest(new { message = "Fyll i rubrik" });
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = "Fyll i innehåll" });
            }

            var newsType = await _context.NewsTypes.FirstOrDefaultAsync(t => t.Id == dto.TypeId);

            if (newsType == null)
            {
                return BadRequest(new { message = "Nyhetstypen kunde inte hittas i databasen" });
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
            var newsItem = await _context.News.FindAsync(id);

            if (newsItem == null)
            {
                return NotFound(new { message = "Nyheten hittades inte" });
            }

            _context.News.Remove(newsItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Nyhet borttagen!" });
        }
    }
}
