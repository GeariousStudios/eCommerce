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

        [Authorize(Roles = "Developer")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateNewsItem(CreateNewsDto dto)
        {
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            if (dto.Type == "")
            {
                return BadRequest(new { message = "Välj nyhetstyp" });
            }

            if (dto.Headline == "")
            {
                return BadRequest(new { message = "Fyll i rubrik" });
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = "Fyll i innehåll" });
            }

            var newsItem = new News
            {
                Date = dto.Date,
                Type = dto.Type ?? "",
                Headline = dto.Headline ?? "",
                Content = dto.Content ?? "",
                Author = userInfo.Value.User,
                AuthorId = userInfo.Value.UserId,
            };

            _context.News.Add(newsItem);
            await _context.SaveChangesAsync();

            var result = new NewsDto
            {
                Id = newsItem.Id,
                Date = newsItem.Date,
                Type = newsItem.Type,
                Headline = newsItem.Headline,
                Content = newsItem.Content,
                Author = newsItem.Author,
                AuthorId = newsItem.AuthorId,
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

        [Authorize(Roles = "Developer")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateNews(int id, UpdateNewsDto dto)
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

            if (dto.Type == "")
            {
                return BadRequest(new { message = "Välj nyhetstyp" });
            }

            if (dto.Headline == "")
            {
                return BadRequest(new { message = "Fyll i rubrik" });
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = "Fyll i innehåll" });
            }

            newsItem.Date = dto.Date;
            newsItem.Type = dto.Type ?? "";
            newsItem.Headline = dto.Headline ?? "";
            newsItem.Content = dto.Content ?? "";
            newsItem.Author = userInfo.Value.User;
            newsItem.AuthorId = userInfo.Value.UserId;

            var result = new NewsDto
            {
                Id = newsItem.Id,
                Date = newsItem.Date,
                Type = newsItem.Type,
                Headline = newsItem.Headline,
                Content = newsItem.Content,
                Author = newsItem.Author,
                AuthorId = newsItem.AuthorId,
            };

            await _context.SaveChangesAsync();

            return Ok(result);
        }

        [Authorize(Roles = "Developer")]
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
