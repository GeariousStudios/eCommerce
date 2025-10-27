using backend.Data;
using backend.Dtos.UnitCell;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("unit-cell")]
    public class UnitCellController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public UnitCellController(
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

        // Called when user wants to get all cell-data for the selected unit.
        // Used for trending.
        [HttpGet("{unitId}")]
        public async Task<IActionResult> GetCellsForUnit(int unitId)
        {
            var cells = await _context
                .UnitCells.Where(c => c.UnitId == unitId)
                .Include(c => c.Column)
                .ToListAsync();

            var result = cells.Select(c => new UnitCellDto
            {
                Id = c.Id,
                UnitId = c.UnitId,
                ColumnId = c.ColumnId,
                ColumnName = c.Column.Name,
                Value = c.Value,
                IntValue = c.IntValue,
                Date = c.Date,

                // Meta data.
                CreationDate = c.CreationDate,
                CreatedBy = c.CreatedBy,
                UpdateDate = c.UpdateDate,
                UpdatedBy = c.UpdatedBy,
            });

            return Ok(result);
        }

        // Called when user wants to get all cell-data for one specific date for the selected unit.
        // Used for trending.
        [HttpGet("range/{unitId}")]
        public async Task<IActionResult> GetCellsForUnitInRange(
            int unitId,
            [FromQuery] DateOnly? start,
            [FromQuery] DateOnly? end
        )
        {
            var lang = await GetLangAsync();

            if (end == null)
            {
                end = DateOnly.FromDateTime(DateTime.UtcNow.Date);
            }

            if (start == null)
            {
                var unitCreated = await _context
                    .Units.Where(u => u.Id == unitId)
                    .Select(u => (DateOnly?)DateOnly.FromDateTime(u.CreationDate.Date))
                    .FirstOrDefaultAsync();

                if (unitCreated != null)
                {
                    start = unitCreated;
                }
                else
                {
                    start = await _context
                        .UnitCells.Where(c => c.UnitId == unitId)
                        .OrderBy(c => c.Date)
                        .Select(c => (DateOnly?)c.Date)
                        .FirstOrDefaultAsync();

                    if (start == null)
                    {
                        return Ok(new List<UnitCellDto>());
                    }
                }
            }

            if (end < start)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("UnitCell/DateRangeInvalid", lang) }
                );
            }

            var cells = await _context
                .UnitCells.Where(c => c.UnitId == unitId && c.Date >= start && c.Date <= end)
                .Include(c => c.Column)
                .ToListAsync();

            var result = cells.Select(c => new UnitCellDto
            {
                Id = c.Id,
                UnitId = c.UnitId,
                ColumnId = c.ColumnId,
                ColumnName = c.Column.Name,
                Value = c.Value,
                IntValue = c.IntValue,
                Hour = c.Hour,
                Date = c.Date,

                // Meta data.
                CreationDate = c.CreationDate,
                CreatedBy = c.CreatedBy,
                UpdateDate = c.UpdateDate,
                UpdatedBy = c.UpdatedBy,
            });

            return Ok(result);
        }

        // Called when user wants to get all cell-data for one specific date for the selected unit.
        // Used for navigating.
        [HttpGet("{unitId}/{date}")]
        public async Task<IActionResult> GetCellsForUnitAndDate(int unitId, DateOnly date)
        {
            var cells = await _context
                .UnitCells.Where(c => c.UnitId == unitId && c.Date == date)
                .Include(c => c.Column)
                .ToListAsync();

            var result = cells.Select(c => new UnitCellDto
            {
                Id = c.Id,
                UnitId = c.UnitId,
                ColumnId = c.ColumnId,
                ColumnName = c.Column.Name,
                Value = c.Value,
                IntValue = c.IntValue,
                Hour = c.Hour,
                Date = c.Date,

                // Meta data.
                CreationDate = c.CreationDate,
                CreatedBy = c.CreatedBy,
                UpdateDate = c.UpdateDate,
                UpdatedBy = c.UpdatedBy,
            });

            return Ok(result);
        }

        // Called when user wants to get all cell-data for one specific date and time for the selected unit.
        // Used when reporting.
        [HttpGet("{unitId}/{date}/{hour}")]
        public async Task<IActionResult> GetCellsForUnitDateAndHour(
            int unitId,
            DateOnly date,
            int hour
        )
        {
            var cells = await _context
                .UnitCells.Where(c => c.UnitId == unitId && c.Date == date && c.Hour == hour)
                .Include(c => c.Column)
                .ToListAsync();

            var result = cells.Select(c => new UnitCellDto
            {
                Id = c.Id,
                UnitId = c.UnitId,
                ColumnId = c.ColumnId,
                ColumnName = c.Column.Name,
                Value = c.Value,
                IntValue = c.IntValue,
                Hour = c.Hour,
                Date = c.Date,

                // Meta data.
                CreationDate = c.CreationDate,
                CreatedBy = c.CreatedBy,
                UpdateDate = c.UpdateDate,
                UpdatedBy = c.UpdatedBy,
            });

            return Ok(result);
        }

        [HttpDelete("delete/{unitId}/{columnId}/{hour}/{date}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> DeleteCell(
            int unitId,
            int columnId,
            int hour,
            DateOnly date
        )
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

            var cell = await _context.UnitCells.FirstOrDefaultAsync(c =>
                c.UnitId == unitId && c.ColumnId == columnId && c.Hour == hour && c.Date == date
            );

            if (cell == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitCell/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "UnitCell",
                cell.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = cell.Id,
                    ["BelongsToUnit"] = $"{cell.Unit?.Name} (ID: {cell.UnitId})",
                    ["BelongsToColumn"] = $"{cell.Column?.Name} (ID: {cell.ColumnId})",
                    ["Date"] = cell.Date?.ToString("yyyy-MM-dd") ?? "—",
                    ["Hour"] = cell.Hour,
                    ["Value"] = cell.Value,
                    ["IntValue"] = cell.IntValue,
                }
            );

            _context.UnitCells.Remove(cell);
            await _context.SaveChangesAsync();

            await UpdateHasDataFlag(columnId);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("UnitCell/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> CreateCell(CreateUnitCellDto dto)
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

            var existingCell = await _context.UnitCells.AnyAsync(c =>
                c.UnitId == dto.UnitId
                && c.ColumnId == dto.ColumnId
                && c.Hour == dto.Hour
                && c.Date == dto.Date
            );

            if (existingCell)
            {
                return BadRequest(new { message = await _t.GetAsync("UnitCell/Duplicate", lang) });
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

            var cell = new UnitCell
            {
                UnitId = dto.UnitId,
                ColumnId = dto.ColumnId,
                Hour = dto.Hour,
                Date = dto.Date,
                Value = dto.Value,
                IntValue = dto.IntValue,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.UnitCells.Add(cell);

            await _context.SaveChangesAsync();

            await UpdateHasDataFlag(cell.ColumnId);
            await _context.SaveChangesAsync();

            var result = new UnitCellDto
            {
                Id = cell.Id,
                UnitId = cell.UnitId,
                ColumnId = cell.ColumnId,
                ColumnName = cell.Column.Name,
                Hour = cell.Hour,
                Date = cell.Date,
                Value = cell.Value,
                IntValue = cell.IntValue,

                // Meta data.
                CreationDate = cell.CreationDate,
                CreatedBy = cell.CreatedBy,
                UpdateDate = cell.UpdateDate,
                UpdatedBy = cell.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "UnitCell",
                cell.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = cell.Id,
                    ["BelongsToUnit"] = $"{cell.Unit?.Name} (ID: {cell.UnitId})",
                    ["BelongsToColumn"] = $"{cell.Column?.Name} (ID: {cell.ColumnId})",
                    ["Date"] = cell.Date?.ToString("yyyy-MM-dd") ?? "—",
                    ["Hour"] = cell.Hour,
                    ["Value"] = cell.Value,
                    ["IntValue"] = cell.IntValue,
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> UpdateCell(int id, UpdateUnitCellDto dto)
        {
            var lang = await GetLangAsync();
            var cell = await _context.UnitCells.FirstOrDefaultAsync(c => c.Id == id);

            if (cell == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitCell/NotFound", lang) });
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
                ["ObjectID"] = cell.Id,
                ["BelongsToUnit"] = $"{cell.Unit?.Name} (ID: {cell.UnitId})",
                ["BelongsToColumn"] = $"{cell.Column?.Name} (ID: {cell.ColumnId})",
                ["Date"] = cell.Date?.ToString("yyyy-MM-dd") ?? "—",
                ["Hour"] = cell.Hour,
                ["Value"] = cell.Value,
                ["IntValue"] = cell.IntValue,
            };

            cell.Value = dto.Value ?? cell.Value;
            cell.IntValue = dto.IntValue ?? cell.IntValue;
            cell.Date = dto.Date ?? cell.Date;

            // Meta data.
            cell.UpdateDate = now;
            cell.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            await UpdateHasDataFlag(cell.ColumnId);
            await _context.SaveChangesAsync();

            var result = new UnitCellDto
            {
                Id = cell.Id,
                UnitId = cell.UnitId,
                ColumnId = cell.ColumnId,
                ColumnName = cell.Column?.Name ?? "",
                Hour = cell.Hour,
                Date = cell.Date,
                Value = cell.Value,
                IntValue = cell.IntValue,

                // Meta data.
                UpdateDate = cell.UpdateDate,
                UpdatedBy = cell.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "UnitCell",
                cell.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = cell.Id,
                        ["BelongsToUnit"] = $"{cell.Unit?.Name} (ID: {cell.UnitId})",
                        ["BelongsToColumn"] = $"{cell.Column?.Name} (ID: {cell.ColumnId})",
                        ["Date"] = cell.Date?.ToString("yyyy-MM-dd") ?? "—",
                        ["Hour"] = cell.Hour,
                        ["Value"] = cell.Value,
                        ["IntValue"] = cell.IntValue,
                    },
                }
            );

            return Ok(result);
        }

        [HttpPut("update-all/{unitId}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> UpdateCells(int unitId, [FromBody] UpdateUnitCellsDto dto)
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

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var allOldValues = new List<Dictionary<string, object?>>();
            var allNewValues = new List<Dictionary<string, object?>>();

            foreach (var value in dto.Values)
            {
                var existing = await _context
                    .UnitCells.Include(c => c.Column)
                    .Include(c => c.Unit)
                    .FirstOrDefaultAsync(c =>
                        c.UnitId == unitId
                        && c.ColumnId == value.ColumnId
                        && c.Date == dto.Date
                        && c.Hour == dto.Hour
                    );

                if (existing != null)
                {
                    var oldValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = existing.Id,
                        ["BelongsToUnit"] = $"{existing.Unit?.Name} (ID: {existing.UnitId})",
                        ["BelongsToColumn"] = $"{existing.Column?.Name} (ID: {existing.ColumnId})",
                        ["Date"] = existing.Date?.ToString("yyyy-MM-dd") ?? "—",
                        ["Hour"] = existing.Hour,
                        ["Value"] = existing.Value,
                        ["IntValue"] = existing.IntValue,
                    };

                    existing.Value = value.Value;
                    existing.IntValue = value.IntValue;

                    // Meta data.
                    existing.UpdateDate = now;
                    existing.UpdatedBy = updatedBy;

                    var newValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = existing.Id,
                        ["BelongsToUnit"] = $"{existing.Unit?.Name} (ID: {existing.UnitId})",
                        ["BelongsToColumn"] = $"{existing.Column?.Name} (ID: {existing.ColumnId})",
                        ["Date"] = existing.Date?.ToString("yyyy-MM-dd") ?? "—",
                        ["Hour"] = existing.Hour,
                        ["Value"] = existing.Value,
                        ["IntValue"] = existing.IntValue,
                    };

                    allOldValues.Add(oldValues);
                    allNewValues.Add(newValues);
                }
                else
                {
                    _context.UnitCells.Add(
                        new UnitCell
                        {
                            UnitId = unitId,
                            ColumnId = value.ColumnId,
                            Hour = dto.Hour,
                            Date = dto.Date,
                            Value = value.Value,
                            IntValue = value.IntValue,

                            // Meta data.
                            CreationDate = now,
                            CreatedBy = updatedBy,
                            UpdateDate = now,
                            UpdatedBy = updatedBy,
                        }
                    );

                    allNewValues.Add(
                        new Dictionary<string, object?>
                        {
                            ["BelongsToUnit"] = $"{unitId}",
                            ["BelongsToColumn"] = $"{value.ColumnId}",
                            ["Date"] = dto.Date.ToString("yyyy-MM-dd"),
                            ["Hour"] = dto.Hour,
                            ["Value"] = value.Value,
                            ["IntValue"] = value.IntValue,
                        }
                    );
                }
            }

            await _context.SaveChangesAsync();

            var affectedColumnIds = dto.Values.Select(v => v.ColumnId).Distinct();
            await UpdateHasDataFlags(affectedColumnIds);
            await _context.SaveChangesAsync();

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "UnitCell",
                0,
                updatedBy,
                userId,
                new
                {
                    OldValues = allOldValues,
                    NewValues = allNewValues,
                    Meta = new Dictionary<string, object?>
                    {
                        ["BelongsToUnit"] = $"{unitId}",
                        ["Date"] = dto.Date.ToString("yyyy-MM-dd"),
                        ["Hour"] = dto.Hour,
                    },
                }
            );

            return Ok(new { message = await _t.GetAsync("UnitCell/Updated", lang) });
        }

        private async Task UpdateHasDataFlag(int columnId)
        {
            var stillHasData = await _context.UnitCells.AnyAsync(c =>
                c.ColumnId == columnId
                && (!string.IsNullOrWhiteSpace(c.Value) || c.IntValue != null)
            );

            var column = await _context.UnitColumns.FirstOrDefaultAsync(c => c.Id == columnId);

            if (column != null)
            {
                column.HasData = stillHasData;
            }
        }

        private async Task UpdateHasDataFlags(IEnumerable<int> columnIds)
        {
            var uniqueIds = columnIds.Distinct();
            var columns = await _context
                .UnitColumns.Where(c => uniqueIds.Contains(c.Id))
                .ToListAsync();

            foreach (var column in columns)
            {
                column.HasData = await _context.UnitCells.AnyAsync(c =>
                    c.ColumnId == column.Id
                    && (!string.IsNullOrWhiteSpace(c.Value) || c.IntValue != null)
                );
            }
        }
    }
}
