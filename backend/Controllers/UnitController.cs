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

        public UnitController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] int[]? unitGroupIds = null,
            [FromQuery] int[]? unitColumnIds = null,
            [FromQuery] int[]? categoryIds = null,
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
                .ThenInclude(uc => uc.Category);

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
                "ishidden" => sortOrder == "desc"
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
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetUnit(int id)
        {
            var unit = await _context
                .Units.Include(u => u.UnitGroup)
                .Include(u => u.UnitToUnitColumns)
                .ThenInclude(uuc => uuc.UnitColumn)
                .Include(u => u.UnitToCategories)
                .ThenInclude(uc => uc.Category)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unit == null)
            {
                return NotFound(new { message = "Enheten kunde inte hittas i databasen" });
            }

            var result = new UnitDto
            {
                Id = unit.Id,
                Name = unit.Name,
                IsHidden = unit.IsHidden,
                UnitGroupId = unit.UnitGroupId,
                UnitGroupName = unit.UnitGroup.Name,
                UnitColumnIds = unit
                    .UnitToUnitColumns.OrderBy(uc => uc.Order)
                    .Select(x => x.UnitColumnId)
                    .ToList(),
                CategoryIds = unit
                    .UnitToCategories.OrderBy(x => x.Order)
                    .Select(x => x.CategoryId)
                    .ToList(),

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
            var unit = await _context.Units.FindAsync(id);

            if (unit == null)
            {
                return NotFound(new { message = "Enheten kunde inte hittas i databasen" });
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

            return Ok(new { message = "Enhet borttagen!" });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUnit(CreateUnitDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = "Gruppen kunde inte hittas" });
            }

            var existingUnit = await _context.Units.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingUnit != null && existingUnit.UnitGroupId == unitGroup.Id)
            {
                return BadRequest(
                    new { message = "En enhet med detta namn finns redan i samma grupp!" }
                );
            }

            if (dto.UnitColumnIds.Count > 4)
            {
                return BadRequest(new { message = "En enhet kan ha max 4 kolumner!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

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
            var unit = await _context
                .Units.Include(u => u.UnitToUnitColumns)
                .Include(u => u.UnitToCategories)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unit == null)
            {
                return NotFound(new { message = "Enheten kunde inte hittas i databasen" });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = "Gruppen kunde inte hittas" });
            }

            var existingUnit = await _context.Units.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingUnit != null && existingUnit.UnitGroupId == unitGroup.Id)
            {
                return BadRequest(
                    new { message = "En enhet med detta namn finns redan i samma grupp!" }
                );
            }

            if (dto.UnitColumnIds.Count > 4)
            {
                return BadRequest(new { message = "En enhet kan ha max 4 kolumner!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
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

                // Meta data.
                UpdateDate = unit.UpdateDate,
                UpdatedBy = unit.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
