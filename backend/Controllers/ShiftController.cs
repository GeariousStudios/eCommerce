using backend.Data;
using backend.Dtos.Shift;
using backend.Dtos.ShiftTeam;
using backend.Dtos.Unit;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("shift")]
    public class ShiftController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;

        public ShiftController(AppDbContext context, UserService userService, ITranslationService t)
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
            [FromQuery] int[]? shiftTeamIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var lang = await GetLangAsync();

            var efQuery = _context
                .Shifts.Include(s => s.ShiftToShiftTeams)
                .ThenInclude(sst => sst.ShiftTeam)
                .Include(s => s.UnitToShifts)
                .ThenInclude(us => us.Unit)
                .AsQueryable();

            efQuery = efQuery.Where(s => s.SystemKey == null);

            if (isHidden.HasValue)
            {
                efQuery = efQuery.Where(s => s.IsHidden == isHidden.Value);
            }

            if (unitIds?.Any() == true)
            {
                efQuery = efQuery.Where(s => s.UnitToShifts.Any(us => unitIds.Contains(us.UnitId)));
            }

            if (shiftTeamIds?.Any() == true)
            {
                efQuery = efQuery.Where(s =>
                    s.ShiftToShiftTeams.Any(st => shiftTeamIds.Contains(st.ShiftTeamId))
                );
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                efQuery = efQuery.Where(s =>
                    s.Name.ToLower().Contains(lowered)
                    || s.ShiftToShiftTeams.Any(st => st.ShiftTeam.Name.ToLower().Contains(lowered))
                );
            }

            var totalCount = await efQuery.CountAsync();
            var query = efQuery.AsEnumerable();

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(s => s.Name.ToLower())
                    : query.OrderBy(s => s.Name.ToLower()),
                "unitcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(s => s.UnitToShifts.Count)
                        .ThenBy(s => s.Name.ToLower())
                    : query.OrderBy(s => s.UnitToShifts.Count).ThenBy(s => s.Name.ToLower()),
                "shiftteamcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(s => s.ShiftToShiftTeams.Count)
                        .ThenBy(s => s.Name.ToLower())
                    : query.OrderBy(s => s.ShiftToShiftTeams.Count).ThenBy(s => s.Name.ToLower()),
                "ishidden" => sortOrder == "desc"
                    ? query.OrderByDescending(s => s.IsHidden).ThenBy(s => s.Name.ToLower())
                    : query.OrderBy(s => s.IsHidden).ThenBy(s => s.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(s => s.Id)
                    : query.OrderBy(s => s.Id),
            };

            var shifts = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.Shifts.CountAsync(s => !s.IsHidden),
                ["Hidden"] = await _context.Shifts.CountAsync(s => s.IsHidden),
            };

            var shiftTeamCount = _context
                .ShiftToShiftTeams.GroupBy(sst => sst.ShiftTeamId)
                .ToDictionary(g => g.Key, g => g.Count());

            var unitCount = _context
                .UnitToShifts.GroupBy(us => us.UnitId)
                .ToDictionary(g => g.Key, g => g.Count());

            var shiftDtos = new List<ShiftDto>();
            foreach (var s in shifts)
            {
                shiftDtos.Add(
                    new ShiftDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        SystemKey = s.SystemKey,
                        IsHidden = s.IsHidden,
                        ShiftTeams = s
                            .ShiftToShiftTeams.OrderBy(sst => sst.Order)
                            .Select(sst => new ShiftTeamDto
                            {
                                Id = sst.ShiftTeam.Id,
                                Name = sst.ShiftTeam.Name,
                            })
                            .ToList(),
                        ShiftTeamDisplayNames = s.ShiftToShiftTeams.ToDictionary(
                            x => x.ShiftTeamId,
                            x => x.DisplayName ?? ""
                        ),
                        ShiftTeamStartTimes = s
                            .ShiftToShiftTeams.Where(x => x.StartTime.HasValue)
                            .ToDictionary(x => x.ShiftTeamId, x => x.StartTime!.Value),
                        ShiftTeamEndTimes = s
                            .ShiftToShiftTeams.Where(x => x.EndTime.HasValue)
                            .ToDictionary(x => x.ShiftTeamId, x => x.EndTime!.Value),
                        Units = s
                            .UnitToShifts.Select(us => us.Unit)
                            .Select(u => new UnitDto
                            {
                                Id = u.Id,
                                Name = u.Name,
                                UnitGroupId = u.UnitGroupId,
                                UnitGroupName = u.UnitGroup?.Name ?? "",
                                IsHidden = u.IsHidden,
                                UnitColumnIds = u
                                    .UnitToUnitColumns.OrderBy(uuc => uuc.Order)
                                    .Select(uuc => uuc.UnitColumnId)
                                    .ToList(),
                                CategoryIds = u
                                    .UnitToCategories.OrderBy(uc => uc.Order)
                                    .Select(uc => uc.CategoryId)
                                    .ToList(),
                                ShiftIds = u
                                    .UnitToShifts.OrderBy(us => us.Order)
                                    .Select(us => us.ShiftId)
                                    .ToList(),
                                CreationDate = u.CreationDate,
                                CreatedBy = u.CreatedBy,
                                UpdateDate = u.UpdateDate,
                                UpdatedBy = u.UpdatedBy,
                            })
                            .ToList(),

                        CreationDate = s.CreationDate,
                        CreatedBy = s.CreatedBy,
                        UpdateDate = s.UpdateDate,
                        UpdatedBy = s.UpdatedBy,
                    }
                );
            }

            var result = new
            {
                totalCount,
                items = shiftDtos,
                counts = new
                {
                    visibilityCount = visibilityCount,
                    shiftTeamCount = shiftTeamCount,
                    unitCount = unitCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetShift(int id)
        {
            var lang = await GetLangAsync();
            var shift = await _context
                .Shifts.Include(s => s.UnitToShifts)
                .ThenInclude(us => us.Unit)
                .Include(s => s.ShiftToShiftTeams)
                .ThenInclude(st => st.ShiftTeam)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (shift == null)
            {
                return NotFound(new { message = await _t.GetAsync("Shift/NotFound", lang) });
            }

            var result = new ShiftDto
            {
                Id = shift.Id,
                Name = shift.Name,
                SystemKey = shift.SystemKey,
                IsHidden = shift.IsHidden,
                ShiftTeams = shift
                    .ShiftToShiftTeams.OrderBy(x => x.Order)
                    .Select(x => new ShiftTeamDto
                    {
                        Id = x.ShiftTeam.Id,
                        Name = x.ShiftTeam.Name,
                        IsHidden = x.ShiftTeam.IsHidden,
                    })
                    .ToList(),
                ShiftTeamDisplayNames = shift.ShiftToShiftTeams.ToDictionary(
                    x => x.ShiftTeamId,
                    x => x.DisplayName ?? ""
                ),
                ShiftTeamStartTimes = shift
                    .ShiftToShiftTeams.Where(x => x.StartTime.HasValue)
                    .ToDictionary(x => x.ShiftTeamId, x => x.StartTime!.Value),
                ShiftTeamEndTimes = shift
                    .ShiftToShiftTeams.Where(x => x.EndTime.HasValue)
                    .ToDictionary(x => x.ShiftTeamId, x => x.EndTime!.Value),
                Units = shift
                    .UnitToShifts.Select(us => us.Unit)
                    .Select(u => new UnitDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        UnitGroupId = u.UnitGroupId,
                        UnitGroupName = u.UnitGroup?.Name ?? "",
                        IsHidden = u.IsHidden,
                        UnitColumnIds = u
                            .UnitToUnitColumns.OrderBy(uuc => uuc.Order)
                            .Select(uuc => uuc.UnitColumnId)
                            .ToList(),
                        CategoryIds = u
                            .UnitToCategories.OrderBy(uc => uc.Order)
                            .Select(uc => uc.CategoryId)
                            .ToList(),
                        ShiftIds = u
                            .UnitToShifts.OrderBy(us => us.Order)
                            .Select(us => us.ShiftId)
                            .ToList(),
                        CreationDate = u.CreationDate,
                        CreatedBy = u.CreatedBy,
                        UpdateDate = u.UpdateDate,
                        UpdatedBy = u.UpdatedBy,
                    })
                    .ToList(),
            };

            return Ok(result);
        }

        [HttpGet("unit/{unitId}")]
        public async Task<IActionResult> GetShiftsForUnit(int unitId)
        {
            var lang = await GetLangAsync();
            var unit = await _context
                .Units.Include(u => u.UnitToShifts.OrderBy(s => s.Order))
                .ThenInclude(us => us.Shift)
                .FirstOrDefaultAsync(u => u.Id == unitId);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Shift/NotFound", lang) });
            }

            var result = new List<ShiftDto>();

            foreach (var us in unit.UnitToShifts.OrderBy(us => us.Order))
            {
                result.Add(
                    new ShiftDto
                    {
                        Id = us.Shift.Id,
                        Name = us.Shift.Name,
                        SystemKey = us.Shift.SystemKey,
                        IsHidden = us.Shift.IsHidden,

                        CreationDate = us.Shift.CreationDate,
                        CreatedBy = us.Shift.CreatedBy,
                        UpdateDate = us.Shift.UpdateDate,
                        UpdatedBy = us.Shift.UpdatedBy,
                    }
                );
            }

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteShift(int id)
        {
            var lang = await GetLangAsync();
            var shift = await _context
                .Shifts.Include(s => s.UnitToShifts)
                .Include(s => s.ShiftToShiftTeams)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (shift == null)
            {
                return NotFound(new { message = await _t.GetAsync("Shift/NotFound", lang) });
            }

            if (shift.UnitToShifts.Any() || shift.ShiftToShiftTeams.Any())
            {
                return BadRequest(new { message = await _t.GetAsync("Shift/InUse", lang) });
            }

            _context.Shifts.Remove(shift);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("Shift/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateShift(CreateShiftDto dto)
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

            var existingShift = await _context.Shifts.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingShift != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Shift/NameTaken", lang) });
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

            var shift = new Shift
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.Shifts.Add(shift);
            await _context.SaveChangesAsync();

            if (dto.ShiftTeamIds?.Any() == true)
            {
                for (int i = 0; i < dto.ShiftTeamIds.Count; i++)
                {
                    var teamId = dto.ShiftTeamIds[i];
                    _context.ShiftToShiftTeams.Add(
                        new ShiftToShiftTeam
                        {
                            ShiftId = shift.Id,
                            ShiftTeamId = teamId,
                            Order = i,
                            DisplayName = dto.ShiftTeamDisplayNames?.GetValueOrDefault(teamId),
                            StartTime = dto.ShiftTeamStartTimes?.GetValueOrDefault(teamId),
                            EndTime = dto.ShiftTeamEndTimes?.GetValueOrDefault(teamId),
                        }
                    );
                }
            }

            await _context.SaveChangesAsync();

            var result = new ShiftDto
            {
                Id = shift.Id,
                Name = shift.Name,
                SystemKey = shift.SystemKey,
                IsHidden = shift.IsHidden,

                // Meta data.
                CreationDate = shift.CreationDate,
                CreatedBy = shift.CreatedBy,
                UpdateDate = shift.UpdateDate,
                UpdatedBy = shift.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateShift(int id, UpdateShiftDto dto)
        {
            var lang = await GetLangAsync();

            if (dto.IsHidden)
            {
                var isActiveSomewhere = await _context.UnitToShifts.AnyAsync(uts =>
                    uts.ShiftId == id && uts.IsActive
                );

                if (isActiveSomewhere)
                {
                    return BadRequest(
                        new { message = await _t.GetAsync("Shift/CannotHideActive", lang) }
                    );
                }
            }

            var shift = await _context.Shifts.FindAsync(id);

            if (shift == null)
            {
                return NotFound(new { message = await _t.GetAsync("Shift/NotFound", lang) });
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

            var existingShift = await _context.Shifts.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingShift != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Shift/NameTaken", lang) });
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

            shift.Name = dto.Name;
            shift.IsHidden = dto.IsHidden;

            // Meta data.
            shift.UpdateDate = now;
            shift.UpdatedBy = updatedBy;

            var existing = _context.ShiftToShiftTeams.Where(x => x.ShiftId == shift.Id);
            _context.ShiftToShiftTeams.RemoveRange(existing);

            if (dto.ShiftTeamIds?.Any() == true)
            {
                for (int i = 0; i < dto.ShiftTeamIds.Count; i++)
                {
                    var teamId = dto.ShiftTeamIds[i];
                    _context.ShiftToShiftTeams.Add(
                        new ShiftToShiftTeam
                        {
                            ShiftId = shift.Id,
                            ShiftTeamId = teamId,
                            Order = i,
                            DisplayName = dto.ShiftTeamDisplayNames?.GetValueOrDefault(teamId),
                            StartTime = dto.ShiftTeamStartTimes?.GetValueOrDefault(teamId),
                            EndTime = dto.ShiftTeamEndTimes?.GetValueOrDefault(teamId),
                        }
                    );
                }
            }

            await _context.SaveChangesAsync();

            var result = new ShiftDto
            {
                Id = shift.Id,
                Name = shift.Name,
                SystemKey = shift.SystemKey,
                IsHidden = shift.IsHidden,

                // Meta data.
                UpdateDate = shift.UpdateDate,
                UpdatedBy = shift.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
