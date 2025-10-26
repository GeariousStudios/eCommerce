using backend.Data;
using backend.Dtos.UnitColumn;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("unit-column")]
    public class UnitColumnController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        public readonly AuditTrailService _audit;

        public UnitColumnController(
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
            [FromQuery] string[]? dataTypes = null,
            [FromQuery] bool? hasData = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var efQuery = _context
                .UnitColumns.Include(c => c.UnitToUnitColumns)
                .ThenInclude(uuc => uuc.Unit)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                efQuery = efQuery.Where(c => c.Name.ToLower().Contains(lowered));
            }

            if (unitIds?.Any() == true)
            {
                efQuery = efQuery.Where(c =>
                    c.UnitToUnitColumns.Any(uuc => unitIds.Contains(uuc.UnitId))
                );
            }

            if (hasData != null)
            {
                efQuery = efQuery.Where(c => c.HasData == hasData.Value);
            }

            var parsedDataTypes = new List<UnitColumnDataType>();

            if (dataTypes?.Any() == true)
            {
                foreach (var dt in dataTypes)
                {
                    if (Enum.TryParse<UnitColumnDataType>(dt, ignoreCase: true, out var parsed))
                        parsedDataTypes.Add(parsed);
                }

                if (parsedDataTypes.Any())
                {
                    efQuery = efQuery.Where(c => parsedDataTypes.Contains(c.DataType));
                }
            }

            var totalCount = await efQuery.CountAsync();
            var query = efQuery.AsEnumerable();

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Name.ToLower())
                    : query.OrderBy(c => c.Name.ToLower()),
                "unitcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(c => c.UnitToUnitColumns.Count)
                        .ThenBy(c => c.Name.ToLower())
                    : query.OrderBy(c => c.UnitToUnitColumns.Count).ThenBy(c => c.Name.ToLower()),
                "hasdata" => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.HasData).ThenBy(c => c.Name.ToLower())
                    : query.OrderBy(c => c.HasData).ThenBy(c => c.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Id)
                    : query.OrderBy(c => c.Id),
            };

            var columns = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // Filters.
            var unitCount = _context
                .UnitToUnitColumns.GroupBy(uuc => uuc.UnitId)
                .ToDictionary(g => g.Key, g => g.Count());

            var dataTypeCount = _context
                .UnitColumns.GroupBy(c => c.DataType)
                .ToDictionary(g => g.Key.ToString(), g => g.Count());

            var hasDataCount = new Dictionary<string, int>
            {
                ["True"] = await _context.UnitColumns.CountAsync(c => c.HasData),
                ["False"] = await _context.UnitColumns.CountAsync(c => !c.HasData),
            };

            var result = new
            {
                totalCount,
                items = columns.Select(c => new UnitColumnDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    DataType = c.DataType,
                    Compare = c.Compare,
                    ComparisonText = c.ComparisonText,
                    LargeColumn = c.LargeColumn,
                    Units = c.UnitToUnitColumns.Select(uuc => uuc.Unit.Name).Distinct().ToList(),
                    HasData = c.HasData,

                    // Meta data.
                    CreationDate = c.CreationDate,
                    CreatedBy = c.CreatedBy,
                    UpdateDate = c.UpdateDate,
                    UpdatedBy = c.UpdatedBy,
                }),
                counts = new
                {
                    unitCount = unitCount,
                    dataTypeCount = dataTypeCount,
                    hasData = hasDataCount,
                },
            };

            return Ok(result);
        }

        // Fetch a specific column.
        // Used when editing/deleting column.
        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetColumn(int id)
        {
            var lang = await GetLangAsync();
            var column = await _context
                .UnitColumns.Include(c => c.UnitToUnitColumns)
                .ThenInclude(uuc => uuc.Unit)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (column == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitColumn/NotFound", lang) });
            }

            var result = new UnitColumnDto
            {
                Id = column.Id,
                Name = column.Name,
                DataType = column.DataType,
                Compare = column.Compare,
                ComparisonText = column.ComparisonText,
                LargeColumn = column.LargeColumn,
                Units = column.UnitToUnitColumns.Select(uuc => uuc.Unit.Name).Distinct().ToList(),
                HasData = column.HasData,
            };

            return Ok(result);
        }

        // Fetch all columns tied to a specific unit.
        // Used in units.
        [HttpGet("unit/{unitId}")]
        public async Task<IActionResult> GetColumnsForUnit(int unitId)
        {
            var lang = await GetLangAsync();
            var unit = await _context
                .Units.Include(u => u.UnitToUnitColumns.OrderBy(uc => uc.Order))
                .ThenInclude(uuc => uuc.UnitColumn)
                .FirstOrDefaultAsync(u => u.Id == unitId);

            if (unit == null)
            {
                return NotFound(new { message = await _t.GetAsync("Unit/NotFound", lang) });
            }

            var result = unit
                .UnitToUnitColumns.OrderBy(uuc => uuc.Order)
                .Select(uuc => new UnitColumnDto
                {
                    Id = uuc.UnitColumn.Id,
                    Name = uuc.UnitColumn.Name,
                    DataType = uuc.UnitColumn.DataType,
                    Compare = uuc.UnitColumn.Compare,
                    ComparisonText = uuc.UnitColumn.ComparisonText,
                    LargeColumn = uuc.UnitColumn.LargeColumn,
                    HasData = uuc.UnitColumn.HasData,

                    // Meta data.
                    CreationDate = uuc.UnitColumn.CreationDate,
                    CreatedBy = uuc.UnitColumn.CreatedBy,
                    UpdateDate = uuc.UnitColumn.UpdateDate,
                    UpdatedBy = uuc.UnitColumn.UpdatedBy,
                });

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteColumn(int id)
        {
            var lang = await GetLangAsync();
            var column = await _context
                .UnitColumns.Include(c => c.UnitToUnitColumns)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (column == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitColumn/NotFound", lang) });
            }

            var isInUse = column.UnitToUnitColumns != null && column.UnitToUnitColumns.Any();

            if (isInUse)
            {
                return BadRequest(new { message = await _t.GetAsync("UnitColumn/InUse", lang) });
            }

            _context.UnitColumns.Remove(column);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("UnitColumn/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateColumn(CreateUnitColumnDto dto)
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

            var existingColumn = await _context.UnitColumns.FirstOrDefaultAsync(c =>
                c.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingColumn != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("UnitColumn/NameTaken", lang) }
                );
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

            var column = new UnitColumn
            {
                Name = dto.Name,
                DataType = dto.DataType,
                Compare = dto.Compare,
                ComparisonText = dto.ComparisonText,
                LargeColumn = dto.LargeColumn,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.UnitColumns.Add(column);
            await _context.SaveChangesAsync();

            var result = new UnitColumnDto
            {
                Name = column.Name,
                DataType = column.DataType,
                HasData = column.HasData,
                Compare = column.Compare,
                ComparisonText = column.ComparisonText,
                LargeColumn = column.LargeColumn,

                // Meta data.
                CreationDate = column.CreationDate,
                CreatedBy = column.CreatedBy,
                UpdateDate = column.UpdateDate,
                UpdatedBy = column.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateColumn(int id, UpdateUnitColumnDto dto)
        {
            var lang = await GetLangAsync();
            var column = await _context
                .UnitColumns.Include(c => c.UnitToUnitColumns)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (column == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitColumn/NotFound", lang) });
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

            var existingColumn = await _context.UnitColumns.FirstOrDefaultAsync(c =>
                c.Name.ToLower() == dto.Name.ToLower() && c.Id != id
            );

            if (existingColumn != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("UnitColumn/NameTaken", lang) }
                );
            }

            if (column.DataType != dto.DataType)
            {
                if (column.HasData)
                {
                    return BadRequest(
                        new
                        {
                            message = await _t.GetAsync("UnitColumn/CannotChangeTypeInUse", lang),
                        }
                    );
                }

                column.DataType = dto.DataType;
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

            column.Name = dto.Name;
            column.Compare = dto.Compare;
            column.ComparisonText = dto.ComparisonText;
            column.LargeColumn = dto.LargeColumn;

            // Meta data.
            column.UpdateDate = now;
            column.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new UnitColumnDto
            {
                Id = column.Id,
                Name = column.Name,
                DataType = column.DataType,
                HasData = column.HasData,
                Compare = column.Compare,
                ComparisonText = column.ComparisonText,
                LargeColumn = column.LargeColumn,

                // Meta data.
                UpdateDate = column.UpdateDate,
                UpdatedBy = column.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
