using backend.Data;
using backend.Dtos.StopType;
using backend.Dtos.Unit;
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
            [FromQuery] int[]? unitIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var lang = await GetLangAsync();

            IQueryable<StopType> query = _context
                .StopTypes.Include(st => st.UnitToStopTypes)
                .ThenInclude(ust => ust.Unit);

            if (isHidden.HasValue)
            {
                query = query.Where(s => s.IsHidden == isHidden.Value);
            }

            if (unitIds?.Any() == true)
            {
                query = query.Where(s =>
                    s.UnitToStopTypes.Any(ust => unitIds.Contains(ust.UnitId))
                );
            }

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
                "unitcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(t => t.UnitToStopTypes.Count)
                        .ThenBy(st => st.Name.ToLower())
                    : query.OrderBy(st => st.UnitToStopTypes.Count).ThenBy(st => st.Name.ToLower()),
                "visibilitycount" => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.IsHidden).ThenBy(t => t.Name.ToLower())
                    : query.OrderBy(t => t.IsHidden).ThenBy(t => t.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(t => t.Id)
                    : query.OrderBy(t => t.Id),
            };

            var totalCount = await query.CountAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.StopTypes.CountAsync(s => !s.IsHidden),
                ["Hidden"] = await _context.StopTypes.CountAsync(s => s.IsHidden),
            };

            var unitCount = await query
                .SelectMany(s => s.UnitToStopTypes)
                .GroupBy(us => us.UnitId)
                .Select(g => new { g.Key, Count = g.Select(x => x.StopTypeId).Distinct().Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

            var stopTypes = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new StopTypeDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    LightColorHex = t.LightColorHex,
                    DarkColorHex = t.DarkColorHex,
                    LightTextColorHex = ColorHelper.GetReadableTextColor(t.LightColorHex),
                    DarkTextColorHex = ColorHelper.GetReadableTextColor(t.DarkColorHex),
                    Units = t
                        .UnitToStopTypes.Select(ust => ust.Unit)
                        .Select(u => new UnitDto
                        {
                            Id = u.Id,
                            Name = u.Name,
                            UnitGroupName = u.UnitGroup != null ? u.UnitGroup.Name : "",
                        })
                        .ToList(),

                    IsHidden = t.IsHidden,

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
                counts = new { visibilityCount, unitCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetStopType(int id)
        {
            var lang = await GetLangAsync();
            var stopType = await _context
                .StopTypes.Include(st => st.UnitToStopTypes)
                .ThenInclude(ust => ust.Unit)
                .ThenInclude(u => u.UnitGroup)
                .FirstOrDefaultAsync(st => st.Id == id);

            if (stopType == null)
            {
                return NotFound(new { message = await _t.GetAsync("StopType/NotFound", lang) });
            }

            var result = new StopTypeDto
            {
                Id = stopType.Id,
                Name = stopType.Name,
                LightColorHex = stopType.LightColorHex,
                DarkColorHex = stopType.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(stopType.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(stopType.DarkColorHex),
                Units = stopType
                    .UnitToStopTypes.Select(ust => ust.Unit)
                    .Select(u => new UnitDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        UnitGroupName = u.UnitGroup != null ? u.UnitGroup.Name : "",
                    })
                    .ToList(),
                IsHidden = stopType.IsHidden,
            };

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
                    ["LightColorHex"] = stopType.LightColorHex,
                    ["DarkColorHex"] = stopType.DarkColorHex,
                    ["IsHidden"] = stopType.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
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
                LightColorHex = dto.LightColorHex,
                DarkColorHex = dto.DarkColorHex,
                IsHidden = dto.IsHidden,

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
                Id = stopType.Id,
                Name = stopType.Name,
                LightColorHex = stopType.LightColorHex,
                DarkColorHex = stopType.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(stopType.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(stopType.DarkColorHex),
                IsHidden = stopType.IsHidden,

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
                    ["LightColorHex"] = stopType.LightColorHex,
                    ["DarkColorHex"] = stopType.DarkColorHex,
                    ["IsHidden"] = stopType.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
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
                ["LightColorHex"] = stopType.LightColorHex,
                ["DarkColorHex"] = stopType.DarkColorHex,
                ["IsHidden"] = stopType.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
            };

            stopType.Name = dto.Name;
            stopType.LightColorHex = dto.LightColorHex;
            stopType.DarkColorHex = dto.DarkColorHex;
            stopType.IsHidden = dto.IsHidden;

            // Meta data.
            stopType.UpdateDate = now;
            stopType.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new StopTypeDto
            {
                Id = stopType.Id,
                Name = stopType.Name,
                LightColorHex = stopType.LightColorHex,
                DarkColorHex = stopType.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(stopType.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(stopType.DarkColorHex),
                IsHidden = stopType.IsHidden,

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
                        ["LightColorHex"] = stopType.LightColorHex,
                        ["DarkColorHex"] = stopType.DarkColorHex,
                        ["IsHidden"] = stopType.IsHidden
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                    },
                }
            );

            return Ok(result);
        }
    }
}
