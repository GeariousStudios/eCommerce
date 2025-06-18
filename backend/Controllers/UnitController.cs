using backend.Data;
using backend.Dtos.Unit;
using backend.Models;
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
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<Unit> query = _context.Units.Include(u => u.UnitGroup);

            if (isHidden.HasValue)
            {
                query = query.Where(u => u.IsHidden == isHidden.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(u =>
                    u.Name.ToLower().Contains(lowered)
                    || u.UnitGroup.Name.ToLower().Contains(lowered)
                );
            }

            var filteredHiddenCount = await query.CountAsync(u => u.IsHidden);
            var filteredVisibleCount = await query.CountAsync(u => !u.IsHidden);

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Name)
                    : query.OrderBy(u => u.Name),
                "unitGroup" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.UnitGroup.Name)
                    : query.OrderBy(u => u.UnitGroup.Name),
                "ishidden" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.IsHidden)
                    : query.OrderBy(u => u.IsHidden),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Id)
                    : query.OrderBy(u => u.Id),
            };

            int totalCount = await query.CountAsync();

            List<Unit> units;

            totalCount = await query.CountAsync();
            units = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var totalHiddenCount = await _context.Units.CountAsync(u => u.IsHidden);
            var totalVisibleCount = await _context.Units.CountAsync(u => !u.IsHidden);

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

                    // Meta data.
                    CreationDate = u.CreationDate,
                    CreatedBy = u.CreatedBy,
                    UpdateDate = u.UpdateDate,
                    UpdatedBy = u.UpdatedBy,
                }),
                counts = new
                {
                    hidden = totalHiddenCount,
                    visible = totalVisibleCount,

                    // Filtered.
                    filteredHidden = filteredHiddenCount,
                    filteredVisible = filteredVisibleCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetUnit(int id)
        {
            var unit = await _context
                .Units.Include(u => u.UnitGroup)
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

            // if (unit.InUse)
            // {
            //     return BadRequest(new { message = "Kan inte ta bort en enhet som används!" });
            // }

            _context.Units.Remove(unit);
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

            var existingUnit = await _context.Units.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingUnit != null)
            {
                return BadRequest(new { message = "Enhet med detta namn finns redan!" });
            }

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = "Enhetsgruppen kunde inte hittas" });
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

            _context.Units.Add(unit);
            await _context.SaveChangesAsync();

            var result = new UnitDto
            {
                Name = unit.Name,
                IsHidden = unit.IsHidden,
                UnitGroupId = unit.UnitGroupId,

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
            var unit = await _context.Units.FindAsync(id);

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

            var existingUnit = await _context.Units.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingUnit != null)
            {
                return BadRequest(new { message = "Enhet med detta namn finns redan!" });
            }

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = "Enhetsgruppen kunde inte hittas" });
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

                // Meta data.
                UpdateDate = unit.UpdateDate,
                UpdatedBy = unit.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
