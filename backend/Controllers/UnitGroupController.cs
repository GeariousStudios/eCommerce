using backend.Data;
using backend.Dtos.Unit;
using backend.Dtos.UnitGroup;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("unit-group")]
    public class UnitGroupController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;

        public UnitGroupController(
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
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] int[]? unitIds = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<UnitGroup> query = _context.UnitGroups.Include(u => u.Units);

            if (unitIds?.Any() == true)
            {
                query = query.Where(ug => ug.Units.Any(u => unitIds.Contains(u.Id)));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(u => u.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Name.ToLower())
                    : query.OrderBy(u => u.Name.ToLower()),
                "unitcount" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Units.Count()).ThenBy(u => u.Name.ToLower())
                    : query.OrderBy(u => u.Units.Count()).ThenBy(u => u.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Id)
                    : query.OrderBy(u => u.Id),
            };

            query = query.Include(u => u.Units);

            var totalCount = await query.CountAsync();

            // Filters.
            var unitCount = await _context
                .UnitGroups.SelectMany(ug => ug.Units)
                .GroupBy(u => u.Id)
                .Select(ug => new { UnitId = ug.Key, Count = ug.Count() })
                .ToDictionaryAsync(x => x.UnitId, x => x.Count);

            var unitGroups = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UnitGroupDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Units = u
                        .Units.Select(unit => new UnitDto { Id = unit.Id, Name = unit.Name })
                        .ToList(),

                    // Meta data.
                    CreationDate = u.CreationDate,
                    CreatedBy = u.CreatedBy,
                    UpdateDate = u.UpdateDate,
                    UpdatedBy = u.UpdatedBy,
                })
                .ToListAsync();

            var result = new
            {
                totalCount,
                items = unitGroups,
                counts = new { unitCount = unitCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetUnitGroup(int id)
        {
            var lang = await GetLangAsync();
            var unit = await _context.UnitGroups.FindAsync(id);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
            }

            var result = new UnitGroupDto
            {
                Id = unit.Id,
                Name = unit.Name,
                Units = new List<UnitDto>(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUnitGroup(int id)
        {
            var lang = await GetLangAsync();
            var unitGroup = await _context
                .UnitGroups.Include(u => u.Units)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unitGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
            }

            if (unitGroup.Units.Any())
            {
                return BadRequest(new { message = await _t.GetAsync("UnitGroup/InUse", lang) });
            }

            _context.UnitGroups.Remove(unitGroup);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("UnitGroup/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUnitGroup(CreateUnitGroupDto dto)
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

            var existingUnitGroup = await _context.UnitGroups.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingUnitGroup != null)
            {
                return BadRequest(new { message = await _t.GetAsync("UnitGroup/NameTaken", lang) });
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

            var unitGroup = new UnitGroup
            {
                Name = dto.Name,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.UnitGroups.Add(unitGroup);
            await _context.SaveChangesAsync();

            var result = new UnitGroupDto
            {
                Id = unitGroup.Id,
                Name = unitGroup.Name,

                // Meta data.
                CreationDate = unitGroup.CreationDate,
                CreatedBy = unitGroup.CreatedBy,
                UpdateDate = unitGroup.UpdateDate,
                UpdatedBy = unitGroup.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUnitGroup(int id, UpdateUnitGroupDto dto)
        {
            var lang = await GetLangAsync();
            var unitGroup = await _context.UnitGroups.FindAsync(id);

            if (unitGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
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

            var existingUnitGroup = await _context.UnitGroups.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingUnitGroup != null)
            {
                return BadRequest(new { message = await _t.GetAsync("UnitGroup/NameTaken", lang) });
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

            unitGroup.Name = dto.Name;

            // Meta data.
            unitGroup.UpdateDate = now;
            unitGroup.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new UnitGroupDto
            {
                Id = unitGroup.Id,
                Name = unitGroup.Name,

                // Meta data.
                UpdateDate = unitGroup.UpdateDate,
                UpdatedBy = unitGroup.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
