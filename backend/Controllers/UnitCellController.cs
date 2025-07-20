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

        public UnitCellController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
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
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end
        )
        {
            if (end < start)
            {
                return BadRequest(new { message = "Slutdatum måste vara efter startdatum!" });
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
            var cell = await _context.UnitCells.FirstOrDefaultAsync(c =>
                c.UnitId == unitId && c.ColumnId == columnId && c.Hour == hour && c.Date == date
            );

            if (cell == null)
            {
                return NotFound(new { message = "Cellen kunde inte hittas i databasen" });
            }

            _context.UnitCells.Remove(cell);
            await _context.SaveChangesAsync();

            await UpdateHasDataFlag(columnId);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cell borttagen!" });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> CreateCell(CreateUnitCellDto dto)
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

            var existingCell = await _context.UnitCells.AnyAsync(c =>
                c.UnitId == dto.UnitId
                && c.ColumnId == dto.ColumnId
                && c.Hour == dto.Hour
                && c.Date == dto.Date
            );

            if (existingCell)
            {
                return BadRequest(
                    new { message = "En cell med samma kolumn, enhet, tid och datum finns redan!" }
                );
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
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

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> UpdateCell(int id, UpdateUnitCellDto dto)
        {
            var cell = await _context.UnitCells.FirstOrDefaultAsync(c => c.Id == id);

            if (cell == null)
            {
                return NotFound(new { message = "Cellen kunde inte hittas i databasen" });
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

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

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
                ColumnName = cell.Column.Name,
                Hour = cell.Hour,
                Date = cell.Date,
                Value = cell.Value,
                IntValue = cell.IntValue,

                // Meta data.
                UpdateDate = cell.UpdateDate,
                UpdatedBy = cell.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update-all/{unitId}")]
        [Authorize(Roles = "Reporter")]
        public async Task<IActionResult> UpdateCells(int unitId, [FromBody] UpdateUnitCellsDto dto)
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

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            foreach (var value in dto.Values)
            {
                var existing = await _context.UnitCells.FirstOrDefaultAsync(c =>
                    c.UnitId == unitId
                    && c.ColumnId == value.ColumnId
                    && c.Date == dto.Date
                    && c.Hour == dto.Hour
                );

                if (existing != null)
                {
                    existing.Value = value.Value;
                    existing.IntValue = value.IntValue;

                    // Meta data.
                    existing.UpdateDate = now;
                    existing.UpdatedBy = updatedBy;
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
                }
            }

            await _context.SaveChangesAsync();

            var affectedColumnIds = dto.Values.Select(v => v.ColumnId).Distinct();
            await UpdateHasDataFlags(affectedColumnIds);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Data uppdaterad" });
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
