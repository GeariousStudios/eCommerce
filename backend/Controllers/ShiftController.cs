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
                .Include(s => s.ShiftToShiftTeamSchedules)
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
                "visibilitycount" => sortOrder == "desc"
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

            var unitCount = await efQuery
                .SelectMany(s => s.UnitToShifts)
                .GroupBy(us => us.UnitId)
                .Select(g => new { g.Key, Count = g.Select(x => x.ShiftId).Distinct().Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);

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
                        ShiftTeamIds = s
                            .ShiftToShiftTeams.OrderBy(sst => sst.Order)
                            .Select(sst => sst.ShiftTeamId)
                            .ToList(),
                        ShiftTeams = s
                            .ShiftToShiftTeams.OrderBy(sst => sst.Order)
                            .Select(sst => new ShiftTeamDto
                            {
                                Id = sst.ShiftTeam.Id,
                                Name = sst.ShiftTeam.Name,
                                ColorHex = sst.ShiftTeam.ColorHex,
                                TextColorHex = ColorHelper.GetReadableTextColor(
                                    sst.ShiftTeam.ColorHex
                                ),
                            })
                            .ToList(),
                        ShiftTeamDisplayNames = s.ShiftToShiftTeams.ToDictionary(
                            x => x.ShiftTeamId,
                            x => x.DisplayName ?? ""
                        ),
                        WeeklyTimes = s
                            .ShiftToShiftTeamSchedules.Select(w => new WeeklyTimeDto
                            {
                                TeamId = w.ShiftTeamId,
                                WeekIndex = w.WeekIndex,
                                DayOfWeek = w.DayOfWeek,
                                Start = w.StartTime,
                                End = w.EndTime,
                            })
                            .ToList(),
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
                .Include(s => s.ShiftToShiftTeamSchedules)
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

                ShiftTeamIds = shift
                    .ShiftToShiftTeams.OrderBy(x => x.Order)
                    .Select(x => x.ShiftTeamId)
                    .ToList(),
                ShiftTeams = shift
                    .ShiftToShiftTeams.OrderBy(x => x.Order)
                    .Select(x => new ShiftTeamDto
                    {
                        Id = x.ShiftTeam.Id,
                        Name = x.ShiftTeam.Name,
                        IsHidden = x.ShiftTeam.IsHidden,
                        ColorHex = x.ShiftTeam.ColorHex,
                        TextColorHex = ColorHelper.GetReadableTextColor(x.ShiftTeam.ColorHex),
                    })
                    .ToList(),
                ShiftTeamDisplayNames = shift.ShiftToShiftTeams.ToDictionary(
                    x => x.ShiftTeamId,
                    x => x.DisplayName ?? ""
                ),
                CycleLengthWeeks = shift.CycleLengthWeeks,
                WeeklyTimes = shift
                    .ShiftToShiftTeamSchedules.Select(sch => new WeeklyTimeDto
                    {
                        TeamId = sch.ShiftTeamId,
                        WeekIndex = sch.WeekIndex,
                        DayOfWeek = sch.DayOfWeek,
                        Start = sch.StartTime,
                        End = sch.EndTime,
                    })
                    .ToList(),
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
        public async Task<IActionResult> GetShiftsForUnit(
            int unitId,
            [FromQuery] string? date = null
        )
        {
            var lang = await GetLangAsync();
            var unit = await _context
                .Units.Include(u => u.UnitToShifts.OrderBy(s => s.Order))
                .ThenInclude(us => us.Shift)
                .ThenInclude(s => s.ShiftToShiftTeams)
                .ThenInclude(sst => sst.ShiftTeam)
                .Include(us => us.UnitToShifts)
                .ThenInclude(us => us.Shift.ShiftToShiftTeamSchedules)
                .FirstOrDefaultAsync(u => u.Id == unitId);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Shift/NotFound", lang) });
            }

            var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
            var localToday = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
            var targetDate = !string.IsNullOrWhiteSpace(date)
                ? DateOnly.Parse(date)
                : DateOnly.FromDateTime(localToday);

            var result = new List<ShiftDto>();

            foreach (var us in unit.UnitToShifts.OrderBy(us => us.Order))
            {
                var shift = us.Shift;

                var weekIndex = GetWeekIndex(
                    shift.AnchorWeekStart,
                    shift.CycleLengthWeeks,
                    targetDate
                );

                var todays = shift
                    .ShiftToShiftTeamSchedules.Where(sch =>
                        sch.WeekIndex == weekIndex && sch.DayOfWeek == targetDate.DayOfWeek
                    )
                    .ToList();

                var displayByTeam = shift.ShiftToShiftTeams.ToDictionary(
                    x => x.ShiftTeamId,
                    x =>
                        string.IsNullOrWhiteSpace(x.DisplayName) ? x.ShiftTeam.Name : x.DisplayName!
                );

                var nameByTeam = shift.ShiftToShiftTeams.ToDictionary(
                    x => x.ShiftTeamId,
                    x => x.ShiftTeam.Name
                );

                var teamSpans = todays
                    .Select(s => new
                    {
                        teamId = s.ShiftTeamId,
                        name = nameByTeam.TryGetValue(s.ShiftTeamId, out var nm) ? nm : "",
                        label = displayByTeam.TryGetValue(s.ShiftTeamId, out var lbl) ? lbl : "",
                        start = s.StartTime.ToString(@"hh\:mm"),
                        end = s.EndTime.ToString(@"hh\:mm"),
                    })
                    .ToList();

                result.Add(
                    new ShiftDto
                    {
                        Id = shift.Id,
                        Name = shift.Name,
                        SystemKey = shift.SystemKey,
                        IsHidden = shift.IsHidden,
                        ShiftTeamSpans = teamSpans
                            .Select(ts => new ShiftTeamSpanDto
                            {
                                TeamId = ts.teamId,
                                Name = ts.name,
                                Label = ts.label,
                                Start = ts.start,
                                End = ts.end,
                                ColorHex =
                                    _context
                                        .ShiftTeams.Where(st => st.Id == ts.teamId)
                                        .Select(st => st.ColorHex)
                                        .FirstOrDefault() ?? "#e0e0e0",
                                TextColorHex = ColorHelper.GetReadableTextColor(
                                    _context
                                        .ShiftTeams.Where(st => st.Id == ts.teamId)
                                        .Select(st => st.ColorHex)
                                        .FirstOrDefault() ?? "#e0e0e0"
                                ),
                            })
                            .ToList(),
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

            if (shift.UnitToShifts.Any())
            {
                return BadRequest(new { message = await _t.GetAsync("Shift/InUse", lang) });
            }

            _context.ShiftToShiftTeams.RemoveRange(shift.ShiftToShiftTeams);

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

            var (hasError, msg) = ValidateNoOverlapWeekly(dto.WeeklyTimes);
            if (hasError && msg != null)
            {
                return BadRequest(new { message = await _t.GetAsync(msg, lang) });
            }

            var tz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Stockholm");
            var localToday = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).Date;
            var anchor = DateOnly.FromDateTime(localToday);
            var diff = ((int)anchor.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
            var monday = anchor.AddDays(-diff);

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var shift = new Shift
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,
                CycleLengthWeeks = dto.CycleLengthWeeks,
                AnchorWeekStart = monday,

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
                        }
                    );
                }
            }

            if (dto.WeeklyTimes?.Any() == true)
            {
                foreach (var w in dto.WeeklyTimes)
                {
                    _context.ShiftToShiftTeamSchedules.Add(
                        new ShiftToShiftTeamSchedule
                        {
                            ShiftId = shift.Id,
                            ShiftTeamId = w.TeamId,
                            WeekIndex = w.WeekIndex,
                            DayOfWeek = w.DayOfWeek,
                            StartTime = w.Start,
                            EndTime = w.End,
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

            var (hasError, msg) = ValidateNoOverlapWeekly(dto.WeeklyTimes);
            if (hasError && msg != null)
            {
                return BadRequest(new { message = await _t.GetAsync(msg, lang) });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            shift.Name = dto.Name;
            shift.IsHidden = dto.IsHidden;
            shift.CycleLengthWeeks = dto.CycleLengthWeeks;

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
                        }
                    );
                }
            }

            var existingSchedules = _context.ShiftToShiftTeamSchedules.Where(x =>
                x.ShiftId == shift.Id
            );
            _context.ShiftToShiftTeamSchedules.RemoveRange(existingSchedules);

            if (dto.WeeklyTimes?.Any() == true)
            {
                foreach (var w in dto.WeeklyTimes)
                {
                    _context.ShiftToShiftTeamSchedules.Add(
                        new ShiftToShiftTeamSchedule
                        {
                            ShiftId = shift.Id,
                            ShiftTeamId = w.TeamId,
                            WeekIndex = w.WeekIndex,
                            DayOfWeek = w.DayOfWeek,
                            StartTime = w.Start,
                            EndTime = w.End,
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

        private static (bool hasError, string? message) ValidateNoOverlapWeekly(
            List<WeeklyTimeDto>? weeklyTimes
        )
        {
            if (weeklyTimes == null)
                return (false, null);

            var grouped = weeklyTimes.GroupBy(w => (w.WeekIndex, w.DayOfWeek));

            foreach (var group in grouped)
            {
                var ordered = group
                    .Select(w =>
                    {
                        var s = (int)w.Start.TotalMinutes;
                        var e = (int)w.End.TotalMinutes;
                        var eAdj = e <= s ? e + 1440 : e;
                        return new { S = s, E = eAdj };
                    })
                    .OrderBy(x => x.S)
                    .ToList();

                for (int i = 0; i < ordered.Count; i++)
                {
                    if (ordered[i].E <= ordered[i].S)
                        return (true, "Shift/StartBeforeEnd");

                    if (i > 0 && ordered[i].S < ordered[i - 1].E)
                        return (true, "Shift/TimesOverlap");
                }
            }

            return (false, null);
        }

        private static int GetWeekIndex(
            DateOnly anchorWeekStart,
            int cycleLengthWeeks,
            DateOnly date
        )
        {
            var days = date.DayNumber - anchorWeekStart.DayNumber;
            var weeksSinceAnchor = Math.DivRem(days, 7, out _);
            if (weeksSinceAnchor < 0)
            {
                weeksSinceAnchor = (int)Math.Floor(days / 7.0);
            }

            var idx = ((weeksSinceAnchor % cycleLengthWeeks) + cycleLengthWeeks) % cycleLengthWeeks;
            return idx;
        }
    }
}
