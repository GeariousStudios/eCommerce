using backend.Data;
using backend.Dtos.Shift;
using backend.Dtos.ShiftTeam;
using backend.Dtos.Unit;
using backend.Dtos.UnitGroup;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("shift-team")]
    public class ShiftTeamController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;

        public ShiftTeamController(
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
            [FromQuery] int[]? shiftIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var efQuery = _context
                .ShiftTeams.Include(st => st.ShiftToShiftTeams)
                .ThenInclude(x => x.Shift)
                .ThenInclude(s => s.UnitToShifts)
                .ThenInclude(us => us.Unit)
                .AsQueryable();

            if (isHidden.HasValue)
            {
                efQuery = efQuery.Where(st => st.IsHidden == isHidden.Value);
            }

            if (shiftIds?.Any() == true)
            {
                efQuery = efQuery.Where(st =>
                    st.ShiftToShiftTeams.Any(sst => shiftIds.Contains(sst.ShiftId))
                );
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                efQuery = efQuery.Where(s =>
                    s.Name.ToLower().Contains(lowered)
                    || s.ShiftToShiftTeams.Any(st => st.Shift.Name.ToLower().Contains(lowered))
                );
            }

            var totalCount = await efQuery.CountAsync();
            var query = efQuery.AsEnumerable();

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(s => s.Name.ToLower())
                    : query.OrderBy(s => s.Name.ToLower()),
                "shiftcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(s => s.ShiftToShiftTeams.Count)
                        .ThenBy(s => s.Name.ToLower())
                    : query.OrderBy(s => s.ShiftToShiftTeams.Count).ThenBy(s => s.Name.ToLower()),
                "visibilitycount" => sortOrder == "desc"
                    ? query.OrderByDescending(s => s.IsHidden).ThenBy(s => s.Name.ToLower())
                    : query.OrderBy(s => s.IsHidden).ThenBy(s => s.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(s => s.Id)
                    : query.OrderBy(s => s.Id),
            };

            var shiftTeams = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.ShiftTeams.CountAsync(st => !st.IsHidden),
                ["Hidden"] = await _context.ShiftTeams.CountAsync(st => st.IsHidden),
            };

            var shiftCount = _context
                .ShiftToShiftTeams.GroupBy(sst => sst.ShiftId)
                .ToDictionary(g => g.Key, g => g.Count());

            var result = new
            {
                totalCount,
                items = shiftTeams.Select(st => new ShiftTeamDto
                {
                    Id = st.Id,
                    Name = st.Name,
                    IsHidden = st.IsHidden,
                    ColorHex = st.ColorHex,
                    TextColorHex = ColorHelper.GetReadableTextColor(st.ColorHex),
                    Shifts = st
                        .ShiftToShiftTeams.OrderBy(sst => sst.Order)
                        .Select(sst => new ShiftDto
                        {
                            Id = sst.Shift.Id,
                            Name = sst.Shift.Name,
                            IsHidden = sst.Shift.IsHidden,
                        })
                        .ToList(),

                    // Meta data.
                    CreationDate = st.CreationDate,
                    CreatedBy = st.CreatedBy,
                    UpdateDate = st.UpdateDate,
                    UpdatedBy = st.UpdatedBy,
                }),
                counts = new { visibilityCount = visibilityCount, shiftCount = shiftCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetShiftTeam(int id)
        {
            var lang = await GetLangAsync();
            var shiftTeam = await _context
                .ShiftTeams.Include(x => x.ShiftToShiftTeams)
                .ThenInclude(x => x.Shift)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (shiftTeam == null)
            {
                return NotFound(new { message = await _t.GetAsync("ShiftTeam/NotFound", lang) });
            }

            var result = new ShiftTeamDto
            {
                Id = shiftTeam.Id,
                Name = shiftTeam.Name,
                IsHidden = shiftTeam.IsHidden,
                ColorHex = shiftTeam.ColorHex,
                TextColorHex = ColorHelper.GetReadableTextColor(shiftTeam.ColorHex),
                Shifts = shiftTeam
                    .ShiftToShiftTeams.OrderBy(x => x.Order)
                    .Select(x => new ShiftDto
                    {
                        Id = x.Shift.Id,
                        Name = x.Shift.Name,
                        IsHidden = x.Shift.IsHidden,
                    })
                    .ToList(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteShiftTeam(int id)
        {
            var lang = await GetLangAsync();
            var shiftTeam = await _context
                .ShiftTeams.Include(st => st.ShiftToShiftTeams)
                .FirstOrDefaultAsync(sst => sst.Id == id);

            if (shiftTeam == null)
            {
                return NotFound(new { message = await _t.GetAsync("ShiftTeam/NotFound", lang) });
            }

            if (shiftTeam.ShiftToShiftTeams.Any())
            {
                return BadRequest(new { message = await _t.GetAsync("ShiftTeam/InUse", lang) });
            }

            _context.ShiftTeams.Remove(shiftTeam);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("ShiftTeam/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateShiftTeam(CreateShiftTeamDto dto)
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

            var existingShiftTeam = await _context.ShiftTeams.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingShiftTeam != null)
            {
                return BadRequest(new { message = await _t.GetAsync("ShiftTeam/NameTaken", lang) });
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

            var shiftTeam = new ShiftTeam
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,
                ColorHex = dto.ColorHex,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.ShiftTeams.Add(shiftTeam);

            await _context.SaveChangesAsync();

            var result = new ShiftTeamDto
            {
                Id = shiftTeam.Id,
                Name = shiftTeam.Name,
                IsHidden = shiftTeam.IsHidden,
                ColorHex = shiftTeam.ColorHex,
                TextColorHex = ColorHelper.GetReadableTextColor(shiftTeam.ColorHex),

                // Meta data.
                CreationDate = shiftTeam.CreationDate,
                CreatedBy = shiftTeam.CreatedBy,
                UpdateDate = shiftTeam.UpdateDate,
                UpdatedBy = shiftTeam.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateShiftTeam(int id, UpdateShiftTeamDto dto)
        {
            var lang = await GetLangAsync();

            if (dto.IsHidden)
            {
                var activeSomewhere = await _context
                    .UnitToShifts.AsNoTracking()
                    .Where(uts => uts.IsActive)
                    .Join(
                        _context
                            .ShiftToShiftTeams.AsNoTracking()
                            .Where(sst => sst.ShiftTeamId == id),
                        uts => uts.ShiftId,
                        sst => sst.ShiftId,
                        (uts, sst) => 1
                    )
                    .AnyAsync();

                if (activeSomewhere)
                {
                    return BadRequest(
                        new { message = await _t.GetAsync("ShiftTeam/CannotHideActive", lang) }
                    );
                }
            }

            var shiftTeam = await _context.ShiftTeams.FindAsync(id);

            if (shiftTeam == null)
            {
                return NotFound(new { message = await _t.GetAsync("ShiftTeam/NotFound", lang) });
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

            var existingShiftTeam = await _context.ShiftTeams.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingShiftTeam != null)
            {
                return BadRequest(new { message = await _t.GetAsync("ShiftTeam/NameTaken", lang) });
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

            shiftTeam.Name = dto.Name;
            shiftTeam.IsHidden = dto.IsHidden;
            shiftTeam.ColorHex = dto.ColorHex;

            // Meta data.
            shiftTeam.UpdateDate = now;
            shiftTeam.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new ShiftTeamDto
            {
                Id = shiftTeam.Id,
                Name = shiftTeam.Name,
                IsHidden = shiftTeam.IsHidden,
                ColorHex = shiftTeam.ColorHex,
                TextColorHex = ColorHelper.GetReadableTextColor(shiftTeam.ColorHex),

                // Meta data.
                UpdateDate = shiftTeam.UpdateDate,
                UpdatedBy = shiftTeam.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
