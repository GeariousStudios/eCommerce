using backend.Data;
using backend.Dtos.News;
using backend.Models;
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

        public NewsController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Developer")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateNewsItem(CreateNewsDto dto)
        {
            var authorInfo = await GetAuthorInfo();

            if (authorInfo == null)
            {
                return BadRequest(new { message = "Ingen behörig användare inloggad." });
            }

            if (dto.Type == "")
            {
                return BadRequest(new { message = "Välj nyhetstyp." });
            }

            if (dto.Headline == "")
            {
                return BadRequest(new { message = "Fyll i rubrik." });
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = "Fyll i innehåll." });
            }

            var newsItem = new News
            {
                Date = dto.Date,
                Type = dto.Type ?? "",
                Headline = dto.Headline ?? "",
                Content = dto.Content ?? "",
                Author = authorInfo.Value.Author,
                AuthorId = authorInfo.Value.AuthorId,
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
                return NotFound(new { message = "Nyheten hittades inte." });
            }

            return Ok(newsItem);
        }

        [Authorize(Roles = "Developer")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateNews(int id, UpdateNewsDto dto)
        {
            var authorInfo = await GetAuthorInfo();

            if (authorInfo == null)
            {
                return BadRequest(new { message = "Ingen behörig användare inloggad." });
            }

            var newsItem = await _context.News.FindAsync(id);
            if (newsItem == null)
            {
                return NotFound(new { message = "Nyheten hittades inte." });
            }

            if (dto.Type == "")
            {
                return BadRequest(new { message = "Välj nyhetstyp." });
            }

            if (dto.Headline == "")
            {
                return BadRequest(new { message = "Fyll i rubrik." });
            }

            if (dto.Content == "<p><br></p>")
            {
                return BadRequest(new { message = "Fyll i innehåll." });
            }

            newsItem.Date = dto.Date;
            newsItem.Type = dto.Type ?? "";
            newsItem.Headline = dto.Headline ?? "";
            newsItem.Content = dto.Content ?? "";
            newsItem.Author = authorInfo.Value.Author;
            newsItem.AuthorId = authorInfo.Value.AuthorId;

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
                return NotFound(new { message = "Nyheten hittades inte." });
            }

            _context.News.Remove(newsItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Nyhet borttagen!" });
        }

        private async Task<(string Author, int AuthorId)?> GetAuthorInfo()
        {
            var username = User.Identity?.Name;

            if (string.IsNullOrWhiteSpace(username))
            {
                return null;
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return null;
            }

            var author = string.IsNullOrEmpty(user.Name) ? user.Username : user.Name;
            return (author, user.Id);
        }
    }
}
