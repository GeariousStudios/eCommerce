using backend.Data;
using backend.Dtos.StopType;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("stop-type")]
    public class StopTypeController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public StopTypeController(
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
            IQueryable<StopType> query = _context.StopTypes;

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

            var stopTypes = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new StopTypeDto
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
                items = stopTypes,
                counts = new { },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetStopType(int id)
        {
            var lang = await GetLangAsync();
            var stopType = await _context.StopTypes.FindAsync(id);

            if (stopType == null)
            {
                return NotFound(new { message = await _t.GetAsync("StopType/NotFound", lang) });
            }

            var result = new StopTypeDto { Id = stopType.Id, Name = stopType.Name };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStopType(int id)
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
            var stopType = await _context.StopTypes.FindAsync(id);

            if (stopType == null)
            {
                return NotFound(new { message = await _t.GetAsync("StopType/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "StopType",
                stopType.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = stopType.Id,
                    ["Name"] = stopType.Name,
                }
            );

            _context.StopTypes.Remove(stopType);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("StopType/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateStopType(CreateStopTypeDto dto)
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

            var existingStopType = await _context.StopTypes.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingStopType != null)
            {
                return BadRequest(new { message = await _t.GetAsync("StopType/NameTaken", lang) });
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

            var stopType = new StopType
            {
                Name = dto.Name,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.StopTypes.Add(stopType);
            await _context.SaveChangesAsync();

            var result = new StopTypeDto
            {
                Name = stopType.Name,

                // Meta data.
                CreationDate = stopType.CreationDate,
                CreatedBy = stopType.CreatedBy,
                UpdateDate = stopType.UpdateDate,
                UpdatedBy = stopType.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "StopType",
                stopType.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = stopType.Id,
                    ["Name"] = stopType.Name,
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStopType(int id, UpdateStopTypeDto dto)
        {
            var lang = await GetLangAsync();
            var stopType = await _context.StopTypes.FindAsync(id);

            if (stopType == null)
            {
                return NotFound(new { message = await _t.GetAsync("StopType/NotFound", lang) });
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

            var existingStopType = await _context.StopTypes.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (existingStopType != null)
            {
                return BadRequest(new { message = await _t.GetAsync("StopType/NameTaken", lang) });
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
                ["ObjectID"] = stopType.Id,
                ["Name"] = stopType.Name,
            };

            stopType.Name = dto.Name;

            // Meta data.
            stopType.UpdateDate = now;
            stopType.UpdatedBy = updatedBy;

            var relatedNews = await _context.News.Where(n => n.TypeId == stopType.Id).ToListAsync();

            foreach (var stop in relatedNews)
            {
                stop.TypeName = dto.Name;
            }

            await _context.SaveChangesAsync();

            var result = new StopTypeDto
            {
                Id = stopType.Id,
                Name = stopType.Name,

                // Meta data.
                UpdateDate = stopType.UpdateDate,
                UpdatedBy = stopType.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "StopType",
                stopType.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = stopType.Id,
                        ["Name"] = stopType.Name,
                    },
                }
            );

            return Ok(result);
        }
    }
}
