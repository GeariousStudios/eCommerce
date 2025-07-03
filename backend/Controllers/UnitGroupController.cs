using backend.Data;
using backend.Dtos.UnitGroup;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("unit-group")]
    public class UnitGroupController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;

        public UnitGroupController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] bool? hasUnits = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<UnitGroup> query = _context.UnitGroups;

            if (hasUnits.HasValue)
            {
                query = query.Where(u => u.Units.Any() == hasUnits.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(u => u.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Name.ToLower())
                    : query.OrderBy(u => u.Name.ToLower()),
                "hasunits" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Units.Any())
                    : query.OrderBy(u => u.Units.Any()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Id)
                    : query.OrderBy(u => u.Id),
            };

            int totalCount = await query.CountAsync();

            var unitGroups = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new UnitGroupDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    HasUnits = u.Units.Any(),

                    // Meta data.
                    CreationDate = u.CreationDate,
                    CreatedBy = u.CreatedBy,
                    UpdateDate = u.UpdateDate,
                    UpdatedBy = u.UpdatedBy,
                })
                .ToListAsync();

            var totalHasUnitsCount = await _context.UnitGroups.CountAsync(u => u.Units.Any());
            var totalNoUnitsCount = await _context.UnitGroups.CountAsync(u => !u.Units.Any());

            var result = new
            {
                totalCount,
                items = unitGroups,
                counts = new { hasUnits = totalHasUnitsCount, noUnits = totalNoUnitsCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetUnitGroup(int id)
        {
            var unit = await _context.UnitGroups.FindAsync(id);

            if (unit == null)
            {
                return NotFound(new { message = "Enhetsgruppen kunde inte hittas i databasen" });
            }

            var result = new UnitGroupDto { Id = unit.Id, Name = unit.Name };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUnitGroup(int id)
        {
            var unitGroup = await _context
                .UnitGroups.Include(u => u.Units)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (unitGroup == null)
            {
                return NotFound(new { message = "Enhetsgruppen kunde inte hittas i databasen" });
            }

            if (unitGroup.Units.Any())
            {
                return BadRequest(new { message = "Kan inte ta bort en enhetsgrupp som används!" });
            }

            _context.UnitGroups.Remove(unitGroup);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Enhetsgrupp borttagen!" });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUnitGroup(CreateUnitGroupDto dto)
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

            var existingUnitGroup = await _context.UnitGroups.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingUnitGroup != null)
            {
                return BadRequest(new { message = "Enhetsgrupp med detta namn finns redan!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var unitGroup = new UnitGroup
            {
                Name = dto.Name,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.UnitGroups.Add(unitGroup);
            await _context.SaveChangesAsync();

            var result = new UnitGroupDto
            {
                Name = unitGroup.Name,

                // Meta data.
                CreationDate = unitGroup.CreationDate,
                CreatedBy = unitGroup.CreatedBy,
                UpdateDate = unitGroup.UpdateDate,
                UpdatedBy = unitGroup.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUnitGroup(int id, UpdateUnitGroupDto dto)
        {
            var unitGroup = await _context.UnitGroups.FindAsync(id);

            if (unitGroup == null)
            {
                return NotFound(new { message = "Enhetsgruppen kunde inte hittas i databasen" });
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

            var existingUnitGroup = await _context.UnitGroups.FirstOrDefaultAsync(u =>
                u.Name.ToLower() == dto.Name.ToLower() && u.Id != id
            );

            if (existingUnitGroup != null)
            {
                return BadRequest(new { message = "Enhetsgrupp med detta namn finns redan!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            unitGroup.Name = dto.Name;

            // Meta data.
            unitGroup.UpdateDate = now;
            unitGroup.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new UnitGroupDto
            {
                Id = unitGroup.Id,
                Name = unitGroup.Name,

                // Meta data.
                UpdateDate = unitGroup.UpdateDate,
                UpdatedBy = unitGroup.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
