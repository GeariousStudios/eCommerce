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
        private readonly AuditTrailService _audit;

        public UnitController(
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
                .GroupBy(u => u.UnitGroup.Name)
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
                    LightColorHex = u.LightColorHex,
                    DarkColorHex = u.DarkColorHex,
                    LightTextColorHex = ColorHelper.GetReadableTextColor(u.LightColorHex),
                    DarkTextColorHex = ColorHelper.GetReadableTextColor(u.DarkColorHex),
                    UnitGroupId = u.UnitGroupId,
                    UnitGroupName = u.UnitGroup.Name,
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
                LightColorHex = unit.LightColorHex,
                DarkColorHex = unit.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(unit.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(unit.DarkColorHex),
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

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (deletedBy, userId) = userInfo.Value;
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

            var affectedColumnIds = await _context
                .UnitCells.Where(uc => uc.UnitId == id)
                .Select(uc => uc.ColumnId)
                .Distinct()
                .ToListAsync();

            var unitColumnsList = string.Join(
                "\n",
                unit.UnitToUnitColumns.OrderBy(x => x.Order)
                    .Select(uuc => $"{uuc.UnitColumn.Name} (ID: {uuc.UnitColumnId})")
                    .DefaultIfEmpty("—")
            );

            var categoriesList = string.Join(
                "\n",
                unit.UnitToCategories.OrderBy(x => x.Order)
                    .Select(uc => $"{uc.Category.Name} (ID: {uc.CategoryId})")
                    .DefaultIfEmpty("—")
            );

            var shiftsList = string.Join(
                "\n",
                unit.UnitToShifts.OrderBy(x => x.Order)
                    .Select(us => $"{us.Shift.Name} (ID: {us.ShiftId})")
                    .DefaultIfEmpty("—")
            );

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "Unit",
                unit.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = unit.Id,
                    ["Name"] = unit.Name,
                    ["LightColorHex"] = unit.LightColorHex,
                    ["DarkColorHex"] = unit.DarkColorHex,
                    ["UnitGroup"] = $"{unit.UnitGroup.Name} (ID: {unit.UnitGroupId})",
                    ["UnitColumns"] = unitColumnsList,
                    ["Categories"] = categoriesList,
                    ["Shifts"] = shiftsList,
                    ["IsHidden"] = unit.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
                }
            );

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

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var unit = new Unit
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,
                UnitGroup = unitGroup,
                LightColorHex = dto.LightColorHex,
                DarkColorHex = dto.DarkColorHex,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            var systemShiftIdsDict = await GetAllSystemShiftIdsAsync();

            foreach (var sysId in systemShiftIdsDict.Values)
            {
                if (!dto.ShiftIds.Contains(sysId))
                    dto.ShiftIds.Insert(0, sysId);
            }

            var finalShiftIds = dto
                .ShiftIds.Distinct()
                .OrderBy(id => systemShiftIdsDict.Values.Contains(id) ? 0 : 1)
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

            await _context
                .Entry(unit)
                .Collection(u => u.UnitToUnitColumns)
                .Query()
                .Include(uuc => uuc.UnitColumn)
                .LoadAsync();

            await _context
                .Entry(unit)
                .Collection(u => u.UnitToCategories)
                .Query()
                .Include(uc => uc.Category)
                .LoadAsync();

            await _context
                .Entry(unit)
                .Collection(u => u.UnitToShifts)
                .Query()
                .Include(us => us.Shift)
                .LoadAsync();

            var result = new UnitDto
            {
                Name = unit.Name,
                IsHidden = unit.IsHidden,
                LightColorHex = unit.LightColorHex,
                DarkColorHex = unit.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(unit.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(unit.DarkColorHex),
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

            var unitColumnsList = string.Join(
                "\n",
                unit.UnitToUnitColumns.OrderBy(x => x.Order)
                    .Select(uuc => $"{uuc.UnitColumn.Name} (ID: {uuc.UnitColumnId})")
                    .DefaultIfEmpty("—")
            );

            var categoriesList = string.Join(
                "\n",
                unit.UnitToCategories.OrderBy(x => x.Order)
                    .Select(uc => $"{uc.Category.Name} (ID: {uc.CategoryId})")
                    .DefaultIfEmpty("—")
            );

            var shiftsList = string.Join(
                "\n",
                unit.UnitToShifts.OrderBy(x => x.Order)
                    .Select(us => $"{us.Shift.Name} (ID: {us.ShiftId})")
                    .DefaultIfEmpty("—")
            );

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "Unit",
                unit.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = unit.Id,
                    ["Name"] = unit.Name,
                    ["LightColorHex"] = unit.LightColorHex,
                    ["DarkColorHex"] = unit.DarkColorHex,
                    ["UnitGroup"] = $"{unit.UnitGroup.Name} (ID: {unit.UnitGroupId})",
                    ["UnitColumns"] = unitColumnsList,
                    ["Categories"] = categoriesList,
                    ["Shifts"] = shiftsList,
                    ["IsHidden"] = unit.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUnit(int id, UpdateUnitDto dto)
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

            var oldUnitColumns = string.Join(
                "\n",
                unit.UnitToUnitColumns.OrderBy(x => x.Order)
                    .Select(x => $"{x.UnitColumn.Name} (ID: {x.UnitColumnId})")
                    .DefaultIfEmpty("—")
            );
            var oldCategories = string.Join(
                "\n",
                unit.UnitToCategories.OrderBy(x => x.Order)
                    .Select(x => $"{x.Category.Name} (ID: {x.CategoryId})")
                    .DefaultIfEmpty("—")
            );
            var oldShifts = string.Join(
                "\n",
                unit.UnitToShifts.OrderBy(x => x.Order)
                    .Select(x => $"{x.Shift.Name} (ID: {x.ShiftId})")
                    .DefaultIfEmpty("—")
            );

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = unit.Id,
                ["Name"] = unit.Name,
                ["LightColorHex"] = unit.LightColorHex,
                ["DarkColorHex"] = unit.DarkColorHex,
                ["UnitGroup"] = $"{unit.UnitGroup.Name} (ID: {unit.UnitGroupId})",
                ["UnitColumns"] = oldUnitColumns,
                ["Categories"] = oldCategories,
                ["Shifts"] = oldShifts,
                ["IsHidden"] = unit.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
            };

            unit.Name = dto.Name;
            unit.IsHidden = dto.IsHidden;
            unit.UnitGroup = unitGroup;
            unit.LightColorHex = dto.LightColorHex;
            unit.DarkColorHex = dto.DarkColorHex;

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
                LightColorHex = unit.LightColorHex,
                DarkColorHex = unit.DarkColorHex,
                LightTextColorHex = ColorHelper.GetReadableTextColor(unit.LightColorHex),
                DarkTextColorHex = ColorHelper.GetReadableTextColor(unit.DarkColorHex),
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

            var unitColumns = await _context
                .UnitColumns.Where(uc => dto.UnitColumnIds.Contains(uc.Id))
                .ToListAsync();

            var newUnitColumns = string.Join(
                "\n",
                unitColumns
                    .OrderBy(uc => dto.UnitColumnIds.IndexOf(uc.Id))
                    .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                    .DefaultIfEmpty("—")
            );

            var categories = await _context
                .Categories.Where(c => dto.CategoryIds.Contains(c.Id))
                .ToListAsync();

            var newCategories = string.Join(
                "\n",
                categories
                    .OrderBy(c => dto.CategoryIds.IndexOf(c.Id))
                    .Select(c => $"{c.Name} (ID: {c.Id})")
                    .DefaultIfEmpty("—")
            );

            var shifts = await _context
                .Shifts.Where(s => finalShiftIds.Contains(s.Id))
                .ToListAsync();

            var newShifts = string.Join(
                "\n",
                shifts
                    .OrderBy(s => finalShiftIds.IndexOf(s.Id))
                    .Select(s => $"{s.Name} (ID: {s.Id})")
                    .DefaultIfEmpty("—")
            );

            var newValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = unit.Id,
                ["Name"] = unit.Name,
                ["LightColorHex"] = unit.LightColorHex,
                ["DarkColorHex"] = unit.DarkColorHex,
                ["UnitGroup"] = $"{unit.UnitGroup.Name} (ID: {unit.UnitGroupId})",
                ["UnitColumns"] = newUnitColumns,
                ["Categories"] = newCategories,
                ["Shifts"] = newShifts,
                ["IsHidden"] = unit.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
            };

            // AUDIT
            await _audit.LogAsync(
                "Update",
                "Unit",
                unit.Id,
                updatedBy,
                userId,
                new { OldValues = oldValues, NewValues = newValues }
            );

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
            {
                return BadRequest(new { message = await _t.GetAsync("Unit/ShiftNotLinked", lang) });
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

            DateTime effectiveFromUtc;
            if (!string.IsNullOrWhiteSpace(dto.Date) && dto.Hour >= 0)
            {
                if (!DateOnly.TryParse(dto.Date, out var d))
                {
                    return BadRequest(
                        new { message = await _t.GetAsync("Unit/InvalidDate", lang) }
                    );
                }

                var hour = Math.Clamp(dto.Hour, 0, 23);
                var minute = Math.Clamp(dto.Minute, 0, 59);
                var local = new DateTime(
                    d.Year,
                    d.Month,
                    d.Day,
                    hour,
                    minute,
                    0,
                    0,
                    DateTimeKind.Local
                );
                effectiveFromUtc = local.ToUniversalTime();
            }
            else
            {
                var localNow = DateTime.Now;
                var localRounded = new DateTime(
                    localNow.Year,
                    localNow.Month,
                    localNow.Day,
                    localNow.Hour,
                    localNow.Minute,
                    0,
                    DateTimeKind.Local
                );
                effectiveFromUtc = localRounded.ToUniversalTime();
            }

            var minuteStart = effectiveFromUtc;
            var minuteEnd = effectiveFromUtc.AddMinutes(1);

            var existsAtSameMinute = await _context.UnitShiftChanges.AnyAsync(c =>
                c.UnitId == id
                && c.EffectiveFromUtc >= minuteStart
                && c.EffectiveFromUtc < minuteEnd
            );
            if (existsAtSameMinute)
                return BadRequest(
                    new { message = await _t.GetAsync("Unit/ShiftChangeAlreadyExists", lang) }
                );

            var prevChange = await _context
                .UnitShiftChanges.Where(c =>
                    c.UnitId == id && c.EffectiveFromUtc <= effectiveFromUtc
                )
                .OrderByDescending(c => c.EffectiveFromUtc)
                .FirstOrDefaultAsync();

            int? baseActiveId = await _context
                .UnitToShifts.Where(l => l.UnitId == id && l.IsActive)
                .Select(l => (int?)l.ShiftId)
                .FirstOrDefaultAsync();

            var oldActiveIdAtThatTime = prevChange?.NewShiftId ?? baseActiveId ?? 0;

            if (oldActiveIdAtThatTime == dto.ActiveShiftId)
            {
                return BadRequest(new { message = await _t.GetAsync("Unit/SameShift", lang) });
            }

            _context.UnitShiftChanges.Add(
                new UnitShiftChange
                {
                    UnitId = id,
                    OldShiftId = oldActiveIdAtThatTime,
                    NewShiftId = dto.ActiveShiftId,
                    EffectiveFromUtc = effectiveFromUtc,

                    // Meta data.
                    CreationDate = now,
                    CreatedBy = updatedBy,
                    UpdateDate = now,
                    UpdatedBy = updatedBy,
                }
            );

            await _context.SaveChangesAsync();

            var latestAtNow = await _context
                .UnitShiftChanges.Where(c => c.UnitId == id && c.EffectiveFromUtc <= now)
                .OrderByDescending(c => c.EffectiveFromUtc)
                .FirstOrDefaultAsync();

            if (latestAtNow != null)
            {
                var newActive = latestAtNow.NewShiftId;
                foreach (var l in links)
                    l.IsActive = (l.ShiftId == newActive);
                unit.UpdateDate = now;
                unit.UpdatedBy = updatedBy;
                await _context.SaveChangesAsync();

                // Audit trail.
                var createdChange = await _context
                    .UnitShiftChanges.OrderByDescending(c => c.Id)
                    .FirstOrDefaultAsync(c =>
                        c.UnitId == id && c.EffectiveFromUtc == effectiveFromUtc
                    );

                if (createdChange != null)
                {
                    var oldShift = await _context.Shifts.FindAsync(oldActiveIdAtThatTime);
                    var newShift = await _context.Shifts.FindAsync(dto.ActiveShiftId);

                    await _audit.LogAsync(
                        "Create",
                        "ShiftChange",
                        createdChange.Id,
                        updatedBy,
                        userId,
                        new Dictionary<string, object?>
                        {
                            ["ObjectID"] = createdChange.Id,
                            ["Unit"] = $"{unit.Name} (ID: {unit.Id})",
                            // ["OldShift"] = $"{oldShift?.Name} (ID: {oldShift?.Id})",
                            ["NewShift"] = $"{newShift?.Name} (ID: {newShift?.Id})",
                            ["EffectiveFromUtc"] = effectiveFromUtc
                                .ToLocalTime()
                                .ToString("yyyy-MM-dd HH:mm"),
                        }
                    );
                }
            }

            return NoContent();
        }

        [HttpPatch("{unitId}/shift-change/{changeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateShiftChange(
            int unitId,
            int changeId,
            UpdateShiftChangeDto dto
        )
        {
            var lang = await GetLangAsync();
            var change = await _context.UnitShiftChanges.FirstOrDefaultAsync(x =>
                x.Id == changeId && x.UnitId == unitId
            );

            if (change == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("Unit/ShiftChangeNotFound", lang) }
                );
            }

            var oldValues = new
            {
                OldShiftId = change.OldShiftId,
                NewShiftId = change.NewShiftId,
                EffectiveFromUtc = change.EffectiveFromUtc,
            };

            DateTime? newEffectiveFromUtc = null;
            if (!string.IsNullOrWhiteSpace(dto.Date) && dto.Hour.HasValue)
            {
                if (!DateOnly.TryParse(dto.Date, out var d))
                    return BadRequest(
                        new { message = await _t.GetAsync("Unit/InvalidDate", lang) }
                    );
                var hour = Math.Clamp(dto.Hour.Value, 0, 23);
                var minute = Math.Clamp(dto.Minute ?? 0, 0, 59);
                var local = new DateTime(
                    d.Year,
                    d.Month,
                    d.Day,
                    hour,
                    minute,
                    0,
                    DateTimeKind.Local
                );
                newEffectiveFromUtc = local.ToUniversalTime();

                var minuteStart = newEffectiveFromUtc.Value;
                var minuteEnd = minuteStart.AddMinutes(1);
                var existsAtSameMinute = await _context.UnitShiftChanges.AnyAsync(c =>
                    c.UnitId == unitId
                    && c.Id != changeId
                    && c.EffectiveFromUtc >= minuteStart
                    && c.EffectiveFromUtc < minuteEnd
                );
                if (existsAtSameMinute)
                    return BadRequest(
                        new { message = await _t.GetAsync("Unit/ShiftChangeAlreadyExists", lang) }
                    );

                change.EffectiveFromUtc = newEffectiveFromUtc.Value;
            }

            if (dto.NewShiftId.HasValue)
            {
                change.NewShiftId = dto.NewShiftId.Value;
            }

            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (updatedBy, userId) = userInfo.Value;

            change.UpdateDate = DateTime.UtcNow;
            change.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var unit = await _context.Units.FindAsync(unitId);

            // Audit trail.
            var oldShift = await _context.Shifts.FindAsync(change.OldShiftId);
            var oldNewShift = await _context.Shifts.FindAsync(oldValues.NewShiftId);
            var newShift = await _context.Shifts.FindAsync(change.NewShiftId);

            await _audit.LogAsync(
                "Update",
                "ShiftChange",
                change.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = change.Id,
                        ["Unit"] = $"{unit?.Name} (ID: {unit?.Id})",
                        // ["OldShift"] = $"{oldShift?.Name} (ID: {oldShift?.Id})",
                        ["NewShift"] = $"{oldNewShift?.Name} (ID: {oldNewShift?.Id})",
                        ["EffectiveFromUtc"] = oldValues
                            .EffectiveFromUtc.ToLocalTime()
                            .ToString("yyyy-MM-dd HH:mm"),
                    },
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = change.Id,
                        ["Unit"] = $"{unit?.Name} (ID: {unit?.Id})",
                        // ["OldShift"] = $"{oldShift?.Name} (ID: {oldShift?.Id})",
                        ["NewShift"] = $"{newShift?.Name} (ID: {newShift?.Id})",
                        ["EffectiveFromUtc"] = change
                            .EffectiveFromUtc.ToLocalTime()
                            .ToString("yyyy-MM-dd HH:mm"),
                    },
                }
            );

            var nowUtc = DateTime.UtcNow;

            var newActiveShiftId = await _context
                .UnitShiftChanges.Where(c => c.UnitId == unitId && c.EffectiveFromUtc <= nowUtc)
                .OrderByDescending(c => c.EffectiveFromUtc)
                .Select(c => (int?)c.NewShiftId)
                .FirstOrDefaultAsync();

            if (newActiveShiftId.HasValue)
            {
                if (unit != null)
                {
                    foreach (var l in unit.UnitToShifts)
                        l.IsActive = (l.ShiftId == newActiveShiftId.Value);

                    unit.UpdateDate = DateTime.UtcNow;
                    unit.UpdatedBy = updatedBy;

                    await _context.SaveChangesAsync();

                    unit.UpdateDate = DateTime.UtcNow;
                    unit.UpdatedBy = updatedBy;
                }
            }

            return NoContent();
        }

        [HttpDelete("{unitId}/shift-change/{changeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteShiftChange(int unitId, int changeId)
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
            var change = await _context.UnitShiftChanges.FirstOrDefaultAsync(x =>
                x.Id == changeId && x.UnitId == unitId
            );

            if (change == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("Unit/ShiftChangeNotFound", lang) }
                );
            }

            var unit = await _context
                .Units.Include(u => u.UnitToShifts)
                .FirstOrDefaultAsync(u => u.Id == unitId);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
            }

            _context.UnitShiftChanges.Remove(change);
            await _context.SaveChangesAsync();

            // Audit trail.
            var oldShift = await _context.Shifts.FindAsync(change.OldShiftId);
            var newShift = await _context.Shifts.FindAsync(change.NewShiftId);

            await _audit.LogAsync(
                "Delete",
                "ShiftChange",
                change.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = change.Id,
                    ["Unit"] = $"{unit.Name} (ID: {unit.Id})",
                    // ["OldShift"] = $"{oldShift?.Name} (ID: {oldShift?.Id})",
                    ["NewShift"] = $"{newShift?.Name} (ID: {newShift?.Id})",
                    ["EffectiveFromUtc"] = change
                        .EffectiveFromUtc.ToLocalTime()
                        .ToString("yyyy-MM-dd HH:mm"),
                }
            );

            var nowUtc = DateTime.UtcNow;

            var latestAtNow = await _context
                .UnitShiftChanges.Where(c => c.UnitId == unitId && c.EffectiveFromUtc <= nowUtc)
                .OrderByDescending(c => c.EffectiveFromUtc)
                .FirstOrDefaultAsync();

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
            }

            int newActiveShiftId;
            if (latestAtNow != null)
            {
                newActiveShiftId = latestAtNow.NewShiftId;
            }
            else
            {
                var systemShiftIds = await GetAllSystemShiftIdsAsync();
                if (!systemShiftIds.TryGetValue(ShiftSystemKey.Unmanned, out newActiveShiftId))
                {
                    newActiveShiftId = systemShiftIds.Values.First();
                }
            }

            foreach (var l in unit.UnitToShifts)
                l.IsActive = (l.ShiftId == newActiveShiftId);

            unit.UpdateDate = DateTime.UtcNow;
            unit.UpdatedBy = deletedBy;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/shift-changes")]
        public async Task<IActionResult> GetShiftChanges(int id, [FromQuery] string date)
        {
            var lang = await GetLangAsync();

            if (!DateOnly.TryParse(date, out var d))
            {
                return BadRequest(new { message = await _t.GetAsync("Unit/InvalidDate", lang) });
            }

            var startLocal = new DateTime(d.Year, d.Month, d.Day, 0, 0, 0, DateTimeKind.Local);
            var endLocal = startLocal.AddDays(1);
            var startUtc = startLocal.ToUniversalTime();
            var endUtc = endLocal.ToUniversalTime();

            var changes = await _context
                .UnitShiftChanges.Where(c =>
                    c.UnitId == id && c.EffectiveFromUtc >= startUtc && c.EffectiveFromUtc < endUtc
                )
                .OrderBy(c => c.EffectiveFromUtc)
                .Select(c => new
                {
                    id = c.Id,
                    hour = c.EffectiveFromUtc.ToLocalTime().Hour,
                    minute = c.EffectiveFromUtc.ToLocalTime().Minute,
                    oldShiftId = c.OldShiftId,
                    newShiftId = c.NewShiftId,
                })
                .ToListAsync();

            var lastPrev = await _context
                .UnitShiftChanges.Where(c => c.UnitId == id && c.EffectiveFromUtc < startUtc)
                .OrderByDescending(c => c.EffectiveFromUtc)
                .FirstOrDefaultAsync();

            var baseShiftId = lastPrev?.NewShiftId;

            if (baseShiftId == null)
            {
                var firstChangeOfDay = await _context
                    .UnitShiftChanges.Where(c =>
                        c.UnitId == id
                        && c.EffectiveFromUtc >= startUtc
                        && c.EffectiveFromUtc < endUtc
                    )
                    .OrderBy(c => c.EffectiveFromUtc)
                    .Select(c => new { c.OldShiftId })
                    .FirstOrDefaultAsync();

                baseShiftId = firstChangeOfDay?.OldShiftId;

                if (baseShiftId == null)
                {
                    baseShiftId = await _context
                        .UnitToShifts.Where(l => l.UnitId == id && l.IsActive)
                        .Select(l => (int?)l.ShiftId)
                        .FirstOrDefaultAsync();
                }
            }

            return Ok(new { baseShiftId, changes });
        }

        private async Task<Dictionary<ShiftSystemKey, int>> GetAllSystemShiftIdsAsync()
        {
            return await _context
                .Shifts.AsNoTracking()
                .Where(s => s.SystemKey != null)
                .GroupBy(s => s.SystemKey!.Value)
                .Select(g => new { Key = g.Key, Id = g.Min(s => s.Id) })
                .ToDictionaryAsync(x => x.Key, x => x.Id);
        }
    }
}
