using backend.Data;
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
    [Route("unit")]
    public class UnitController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;

        public UnitController(AppDbContext context, UserService userService, ITranslationService t)
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
            [FromQuery] int[]? unitGroupIds = null,
            [FromQuery] int[]? unitColumnIds = null,
            [FromQuery] int[]? categoryIds = null,
            [FromQuery] int[]? shiftIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<Unit> query = _context
                .Units.Include(u => u.UnitGroup)
                .Include(u => u.UnitToUnitColumns)
                .ThenInclude(uuc => uuc.UnitColumn)
                .Include(u => u.UnitToCategories)
                .ThenInclude(uc => uc.Category)
                .Include(u => u.UnitToShifts)
                .ThenInclude(us => us.Shift);

            if (isHidden.HasValue)
            {
                query = query.Where(u => u.IsHidden == isHidden.Value);
            }

            if (unitGroupIds?.Any() == true)
            {
                query = query.Where(u => unitGroupIds.Contains(u.UnitGroupId));
            }

            if (unitColumnIds?.Any() == true)
            {
                query = query.Where(u =>
                    u.UnitToUnitColumns.Any(uuc => unitColumnIds.Contains(uuc.UnitColumnId))
                );
            }

            if (categoryIds?.Any() == true)
            {
                query = query.Where(u =>
                    u.UnitToCategories.Any(uc => categoryIds.Contains(uc.CategoryId))
                );
            }

            if (shiftIds?.Any() == true)
            {
                query = query.Where(u => u.UnitToShifts.Any(us => shiftIds.Contains(us.ShiftId)));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(u =>
                    u.Name.ToLower().Contains(lowered)
                    || u.UnitGroup.Name.ToLower().Contains(lowered)
                );
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Name.ToLower())
                    : query.OrderBy(u => u.Name.ToLower()),
                "unitgroupname" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.UnitGroup.Name).ThenBy(u => u.Name.ToLower())
                    : query.OrderBy(u => u.UnitGroup.Name).ThenBy(u => u.Name.ToLower()),
                "unitcolumncount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(u => u.UnitToUnitColumns.Count)
                        .ThenBy(u => u.Name.ToLower())
                    : query.OrderBy(u => u.UnitToUnitColumns.Count).ThenBy(u => u.Name.ToLower()),
                "categorycount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(u => u.UnitToCategories.Count)
                        .ThenBy(u => u.Name.ToLower())
                    : query.OrderBy(u => u.UnitToCategories.Count).ThenBy(u => u.Name.ToLower()),
                "shiftcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(u => u.UnitToShifts.Count)
                        .ThenBy(u => u.Name.ToLower())
                    : query.OrderBy(u => u.UnitToShifts.Count).ThenBy(u => u.Name.ToLower()),
                "visibilitycount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(u => u.IsHidden)
                        .ThenBy(u => u.UnitGroup.Name)
                        .ThenBy(u => u.Name)
                    : query
                        .OrderBy(u => u.IsHidden)
                        .ThenBy(u => u.UnitGroup.Name)
                        .ThenBy(u => u.Name),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Id)
                    : query.OrderBy(u => u.Id),
            };

            var totalCount = await query.CountAsync();

            List<Unit> units;
            units = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.Units.CountAsync(u => !u.IsHidden),
                ["Hidden"] = await _context.Units.CountAsync(u => u.IsHidden),
            };

            var unitGroupCount = _context
                .Units.Include(u => u.UnitGroup)
                .AsEnumerable()
                .GroupBy(u => u.UnitGroup?.Name ?? "Okänd grupp")
                .ToDictionary(g => g.Key, g => g.Count());

            var unitColumnCount = _context
                .Units.AsEnumerable()
                .SelectMany(u => u.UnitToUnitColumns)
                .GroupBy(uuc => uuc.UnitColumnId)
                .ToDictionary(g => g.Key, g => g.Count());

            var categoryCount = _context
                .Units.AsEnumerable()
                .SelectMany(u => u.UnitToCategories)
                .GroupBy(uc => uc.CategoryId)
                .ToDictionary(g => g.Key, g => g.Count());

            var shiftCount = _context
                .Units.AsEnumerable()
                .SelectMany(u => u.UnitToShifts)
                .GroupBy(us => us.ShiftId)
                .ToDictionary(g => g.Key, g => g.Count());

            var result = new
            {
                totalCount,
                items = units.Select(u => new UnitDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    IsHidden = u.IsHidden,
                    UnitGroupId = u.UnitGroupId,
                    UnitGroupName = u.UnitGroup.Name ?? "Okänd grupp",
                    UnitColumnIds = u
                        .UnitToUnitColumns.OrderBy(x => x.Order)
                        .Select(x => x.UnitColumnId)
                        .ToList(),
                    CategoryIds = u
                        .UnitToCategories.OrderBy(x => x.Order)
                        .Select(x => x.CategoryId)
                        .ToList(),
                    ShiftIds = u
                        .UnitToShifts.OrderBy(x => x.Order)
                        .Where(us => us.Shift.SystemKey == null)
                        .Select(x => x.ShiftId)
                        .ToList(),
                    ActiveShiftId = u.UnitToShifts.FirstOrDefault(s => s.IsActive)?.ShiftId,

                    // Meta data.
                    CreationDate = u.CreationDate,
                    CreatedBy = u.CreatedBy,
                    UpdateDate = u.UpdateDate,
                    UpdatedBy = u.UpdatedBy,
                }),
                counts = new
                {
                    visibilityCount = visibilityCount,
                    unitGroupCount = unitGroupCount,
                    unitColumnCount = unitColumnCount,
                    categoryCount = categoryCount,
                    shiftCount = shiftCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetUnit(int id)
        {
            var lang = await GetLangAsync();
            var unit = await _context
                .Units.Include(u => u.UnitGroup)
                .Include(u => u.UnitToUnitColumns)
                .ThenInclude(uuc => uuc.UnitColumn)
                .Include(u => u.UnitToCategories)
                .ThenInclude(uc => uc.Category)
                .Include(u => u.UnitToShifts)
                .ThenInclude(us => us.Shift)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
            }

            var unknownGroup = await _t.GetAsync("UnitGroup/Unknown", lang);

            var result = new UnitDto
            {
                Id = unit.Id,
                Name = unit.Name,
                IsHidden = unit.IsHidden,
                UnitGroupId = unit.UnitGroupId,
                UnitGroupName = unit.UnitGroup.Name ?? unknownGroup,
                UnitColumnIds = unit
                    .UnitToUnitColumns.OrderBy(uc => uc.Order)
                    .Select(x => x.UnitColumnId)
                    .ToList(),
                CategoryIds = unit
                    .UnitToCategories.OrderBy(x => x.Order)
                    .Select(x => x.CategoryId)
                    .ToList(),
                ShiftIds = unit
                    .UnitToShifts.OrderBy(x => x.Order)
                    .Where(us => us.Shift.SystemKey == null)
                    .Select(x => x.ShiftId)
                    .ToList(),
                ActiveShiftId = unit.UnitToShifts.FirstOrDefault(s => s.IsActive)?.ShiftId,

                // Meta data.
                CreationDate = unit.CreationDate,
                CreatedBy = unit.CreatedBy,
                UpdateDate = unit.UpdateDate,
                UpdatedBy = unit.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var lang = await GetLangAsync();
            var unit = await _context.Units.FindAsync(id);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
            }

            var affectedColumnIds = await _context
                .UnitCells.Where(uc => uc.UnitId == id)
                .Select(uc => uc.ColumnId)
                .Distinct()
                .ToListAsync();

            _context.Units.Remove(unit);
            await _context.SaveChangesAsync();

            var columnsToUpdate = await _context
                .UnitColumns.Where(c => affectedColumnIds.Contains(c.Id))
                .ToListAsync();

            foreach (var column in columnsToUpdate)
            {
                column.HasData = await _context.UnitCells.AnyAsync(uc => uc.ColumnId == column.Id);
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("Unit/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUnit(CreateUnitDto dto)
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

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
            }

            var existingUnit = await _context.Units.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingUnit != null && existingUnit.UnitGroupId == unitGroup.Id)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Unit/NameTakenInGroup", lang) }
                );
            }

            if (dto.UnitColumnIds.Count > 4)
            {
                return BadRequest(new { message = await _t.GetAsync("Unit/MaxColumns", lang) });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var systemShiftIds = await _context
                .Shifts.Where(s => s.SystemKey != null)
                .Select(s => s.Id)
                .ToListAsync();

            foreach (var sysId in systemShiftIds)
            {
                if (!dto.ShiftIds.Contains(sysId))
                {
                    dto.ShiftIds.Insert(0, sysId);
                }
            }

            var orderedShiftIds = dto
                .ShiftIds.OrderBy(id => systemShiftIds.Contains(id) ? 0 : 1)
                .ToList();

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var unit = new Unit
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,
                UnitGroup = unitGroup,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            var systemShiftIdsDict = await GetAllSystemShiftIdsAsync(); // Dictionary<ShiftSystemKey, int>

            // Lägg till alla systemskift först
            foreach (var sysId in systemShiftIdsDict.Values)
            {
                if (!dto.ShiftIds.Contains(sysId))
                    dto.ShiftIds.Insert(0, sysId);
            }

            var finalShiftIds = dto
                .ShiftIds.OrderBy(id => systemShiftIdsDict.Values.Contains(id) ? 0 : 1)
                .ToList();

            var activeShiftId = systemShiftIdsDict.TryGetValue(
                ShiftSystemKey.Unmanned,
                out var unmannedId
            )
                ? unmannedId
                : systemShiftIdsDict.Values.First();

            unit.UnitToUnitColumns = dto
                .UnitColumnIds.Select(
                    (colId, index) => new UnitToUnitColumn { UnitColumnId = colId, Order = index }
                )
                .ToList();

            unit.UnitToCategories = dto
                .CategoryIds.Select(
                    (catId, index) => new UnitToCategory { CategoryId = catId, Order = index }
                )
                .ToList();

            unit.UnitToShifts = finalShiftIds
                .Select(
                    (shiftId, index) =>
                        new UnitToShift
                        {
                            ShiftId = shiftId,
                            Order = index,
                            IsActive = shiftId == activeShiftId,
                        }
                )
                .ToList();

            _context.Units.Add(unit);
            await _context.SaveChangesAsync();

            var result = new UnitDto
            {
                Name = unit.Name,
                IsHidden = unit.IsHidden,
                UnitGroupId = unit.UnitGroupId,
                UnitColumnIds = unit
                    .UnitToUnitColumns.OrderBy(x => x.Order)
                    .Select(x => x.UnitColumnId)
                    .ToList(),
                CategoryIds = unit
                    .UnitToCategories.OrderBy(x => x.Order)
                    .Select(x => x.CategoryId)
                    .ToList(),
                ShiftIds = unit.UnitToShifts.OrderBy(x => x.Order).Select(x => x.ShiftId).ToList(),
                ActiveShiftId = unit.UnitToShifts.FirstOrDefault(s => s.IsActive)?.ShiftId,

                // Meta data.
                CreationDate = unit.CreationDate,
                CreatedBy = unit.CreatedBy,
                UpdateDate = unit.UpdateDate,
                UpdatedBy = unit.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUnit(int id, UpdateUnitDto dto)
        {
            var lang = await GetLangAsync();
            var unit = await _context
                .Units.Include(u => u.UnitToUnitColumns)
                .Include(u => u.UnitToCategories)
                .Include(u => u.UnitToShifts)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
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

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
            }

            var existingUnit = await _context.Units.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingUnit != null && existingUnit.UnitGroupId == unitGroup.Id)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Unit/NameTakenInGroup", lang) }
                );
            }

            if (dto.UnitColumnIds.Count > 4)
            {
                return BadRequest(new { message = await _t.GetAsync("Unit/MaxColumns", lang) });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var activeShiftId = await _context
                .UnitToShifts.Where(l => l.UnitId == id && l.IsActive)
                .Select(l => l.ShiftId)
                .FirstOrDefaultAsync();

            var systemShiftIdsDict = await GetAllSystemShiftIdsAsync();

            dto.ShiftIds = dto
                .ShiftIds.Where(id => !systemShiftIdsDict.Values.Contains(id))
                .Distinct()
                .ToList();

            var finalShiftIds = systemShiftIdsDict.Values.Concat(dto.ShiftIds).ToList();

            if (activeShiftId != 0 && !finalShiftIds.Contains(activeShiftId))
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Unit/CannotRemoveActiveShift", lang) }
                );
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            unit.Name = dto.Name;
            unit.IsHidden = dto.IsHidden;
            unit.UnitGroup = unitGroup;

            var oldUnitColumnLinks = await _context
                .UnitToUnitColumns.Where(l => l.UnitId == unit.Id)
                .ToListAsync();

            _context.UnitToUnitColumns.RemoveRange(oldUnitColumnLinks);

            var newUnitColumnLinks = dto
                .UnitColumnIds.Select(
                    (colId, index) =>
                        new UnitToUnitColumn
                        {
                            UnitId = unit.Id,
                            UnitColumnId = colId,
                            Order = index,
                        }
                )
                .ToList();

            _context.UnitToUnitColumns.AddRange(newUnitColumnLinks);

            var oldCategoryLinks = await _context
                .UnitToCategories.Where(l => l.UnitId == unit.Id)
                .ToListAsync();

            _context.UnitToCategories.RemoveRange(oldCategoryLinks);

            var newUnitCategoryLinks = dto
                .CategoryIds.Select(
                    (catId, index) =>
                        new UnitToCategory
                        {
                            UnitId = unit.Id,
                            CategoryId = catId,
                            Order = index,
                        }
                )
                .ToList();

            _context.UnitToCategories.AddRange(newUnitCategoryLinks);

            var oldShiftLinks = await _context
                .UnitToShifts.Where(l => l.UnitId == unit.Id)
                .ToListAsync();

            _context.UnitToShifts.RemoveRange(oldShiftLinks);

            var newShiftLinks = finalShiftIds
                .Select(
                    (shiftId, index) =>
                        new UnitToShift
                        {
                            UnitId = unit.Id,
                            ShiftId = shiftId,
                            Order = index,
                            IsActive = shiftId == activeShiftId,
                        }
                )
                .ToList();

            _context.UnitToShifts.AddRange(newShiftLinks);

            // Meta data.
            unit.UpdateDate = now;
            unit.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new UnitDto
            {
                Id = unit.Id,
                Name = unit.Name,
                IsHidden = unit.IsHidden,
                UnitGroupId = unit.UnitGroupId,
                UnitColumnIds = unit
                    .UnitToUnitColumns.OrderBy(x => x.Order)
                    .Select(x => x.UnitColumnId)
                    .ToList(),
                CategoryIds = unit
                    .UnitToCategories.OrderBy(x => x.Order)
                    .Select(x => x.CategoryId)
                    .ToList(),
                ShiftIds = unit.UnitToShifts.OrderBy(x => x.Order).Select(x => x.ShiftId).ToList(),
                ActiveShiftId = unit.UnitToShifts.FirstOrDefault(s => s.IsActive)?.ShiftId,

                // Meta data.
                UpdateDate = unit.UpdateDate,
                UpdatedBy = unit.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPatch("{id}/active-shift")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetActiveShift(int id, SetActiveShiftDto dto)
        {
            var lang = await GetLangAsync();
            var unit = await _context
                .Units.Include(u => u.UnitToShifts)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
            }

            var links = unit.UnitToShifts;
            if (!links.Any(l => l.ShiftId == dto.ActiveShiftId))
                return BadRequest(new { message = await _t.GetAsync("Unit/ShiftNotLinked", lang) });

            foreach (var l in links)
            {
                l.IsActive = (l.ShiftId == dto.ActiveShiftId);
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

            unit.UpdateDate = now;
            unit.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<Dictionary<ShiftSystemKey, int>> GetAllSystemShiftIdsAsync()
        {
            return await _context
                .Shifts.Where(s => s.SystemKey != null)
                .ToDictionaryAsync(s => s.SystemKey!.Value, s => s.Id);
        }
    }
}
