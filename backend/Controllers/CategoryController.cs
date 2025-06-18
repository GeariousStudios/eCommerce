using backend.Data;
using backend.Dtos.Category;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("category")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;

        public CategoryController(AppDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        // WORD OF NOTE - If too many categories in the future (1000+), then performance might become an issue.
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string[]? units = null,
            [FromQuery] bool? hasSubCategories = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var efQuery = _context
                .Categories.Include(c => c.SubCategories)
                .Include(c => c.Units)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                efQuery = efQuery.Where(c =>
                    c.Name.ToLower().Contains(lowered)
                    || (
                        c.SubCategories != null
                        && c.SubCategories.Any(sc => sc.Name.ToLower().Contains(lowered))
                    )
                );
            }

            if (hasSubCategories.HasValue)
            {
                if (hasSubCategories.Value)
                {
                    efQuery = efQuery.Where(c => c.SubCategories != null && c.SubCategories.Any());
                }
                else
                {
                    efQuery = efQuery.Where(c => c.SubCategories == null || !c.SubCategories.Any());
                }
            }

            var filteredSubCategoryCount = await efQuery
                .Where(c => c.SubCategories != null)
                .SelectMany(c => c.SubCategories!)
                .CountAsync();

            var totalCount = await efQuery.CountAsync();

            var query = efQuery.AsEnumerable();

            if (units?.Any() == true)
            {
                var unitIds = units.Select(int.Parse).ToList();
                query = query.Where(c =>
                    c.Units != null && c.Units.Any(u => unitIds.Contains(u.Id))
                );
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Name)
                    : query.OrderBy(c => c.Name),
                "subCategories" => sortOrder == "desc"
                    ? query.OrderByDescending(c =>
                        c.SubCategories!.OrderBy(sc => sc.Name)
                            .Select(sc => sc.Name)
                            .FirstOrDefault()
                    )
                    : query.OrderBy(c =>
                        c.SubCategories!.OrderBy(sc => sc.Name)
                            .Select(sc => sc.Name)
                            .FirstOrDefault()
                    ),
                "units" => sortOrder == "desc"
                    ? query.OrderByDescending(c =>
                        c.Units!.OrderBy(u => u.Name).Select(u => u.Name).FirstOrDefault()
                    )
                    : query.OrderBy(c =>
                        c.Units!.OrderBy(u => u.Name).Select(u => u.Name).FirstOrDefault()
                    ),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Id)
                    : query.OrderBy(c => c.Id),
            };

            var categories = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var totalSubCategoryCount = await _context
                .Categories.Where(c => c.SubCategories != null)
                .SelectMany(c => c.SubCategories!)
                .CountAsync();

            var withSubCategoryCount = await _context.Categories.CountAsync(c =>
                c.SubCategories != null && c.SubCategories.Any()
            );

            var withoutSubCategoryCount = await _context.Categories.CountAsync(c =>
                c.SubCategories == null || !c.SubCategories.Any()
            );

            var unitCounts = _context
                .Categories.AsEnumerable()
                .SelectMany(c => c.Units ?? Enumerable.Empty<Unit>())
                .GroupBy(u => u.Name)
                .Select(g => new { Name = g.Key, Count = g.Count() })
                .ToList();

            var filteredUnitCount = query
                .SelectMany(c => c.Units ?? Array.Empty<Unit>())
                .GroupBy(u => u.Name)
                .Select(g => new { Name = g.Key, Count = g.Count() })
                .ToList();

            var result = new
            {
                totalCount,
                items = categories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Units = c.Units?.Select(u => u.Name).ToList() ?? new(),
                    SubCategories = c.SubCategories?.Select(sc => sc.Name).ToList() ?? new(),
                    CreationDate = c.CreationDate,
                    CreatedBy = c.CreatedBy,
                    UpdateDate = c.UpdateDate,
                    UpdatedBy = c.UpdatedBy,
                }),
                counts = new
                {
                    subCategories = totalSubCategoryCount,
                    withSubCategories = withSubCategoryCount,
                    withoutSubCategories = withoutSubCategoryCount,
                    unitCounts = unitCounts.ToDictionary(u => u.Name, u => u.Count),

                    // Filtered.
                    filteredsubCategories = filteredSubCategoryCount,
                    filteredUnits = filteredUnitCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context
                .Categories.Include(c => c.Units)
                .Include(c => c.SubCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = "Kategorin kunde inte hittas i databasen" });
            }

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Units = category.Units?.Select(u => u.Name).ToList() ?? new(),
                SubCategories = category.SubCategories?.Select(sc => sc.Name).ToList() ?? new(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "Kategorin kunde inte hittas i databasen" });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kategori borttagen!" });
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateCategory(CreateCategoryDto dto)
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

            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c =>
                c.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingCategory != null)
            {
                return BadRequest(new { message = "Kategori med detta namn finns redan!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var category = new Category
            {
                Name = dto.Name,
                Units =
                    dto.Units != null
                        ? await _context.Units.Where(u => dto.Units.Contains(u.Id)).ToListAsync()
                        : new List<Unit>(),
                SubCategories = dto
                    .SubCategories?.Select(name => new SubCategory { Name = name })
                    .ToList(),
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Units = category.Units?.Select(u => u.Name).ToList() ?? new(),
                SubCategories = category.SubCategories?.Select(sc => sc.Name).ToList() ?? new(),
                CreationDate = category.CreationDate,
                CreatedBy = category.CreatedBy,
                UpdateDate = category.UpdateDate,
                UpdatedBy = category.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto dto)
        {
            var category = await _context
                .Categories.Include(c => c.Units)
                .Include(c => c.SubCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = "Kategorin kunde inte hittas i databasen" });
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

            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c =>
                c.Name.ToLower() == dto.Name.ToLower() && c.Id != id
            );

            if (existingCategory != null)
            {
                return BadRequest(new { message = "Kategori med detta namn finns redan!" });
            }

            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
            {
                return Unauthorized(new { message = "Ingen behörig användare inloggad" });
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            category.Name = dto.Name;

            if (category.Units != null)
            {
                category.Units.Clear();
            }

            if (category.SubCategories != null)
            {
                _context.SubCategories.RemoveRange(category.SubCategories);
            }

            if (dto.Units != null && dto.Units.Any())
            {
                var newUnits = await _context
                    .Units.Where(u => dto.Units.Contains(u.Id))
                    .ToListAsync();

                foreach (var unit in newUnits)
                {
                    category.Units?.Add(unit);
                }
            }

            category.SubCategories = dto
                .SubCategories?.Select(name => new SubCategory { Name = name })
                .ToList();
            category.UpdateDate = now;
            category.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Units = category.Units?.Select(u => u.Name).ToList() ?? new(),
                SubCategories = category.SubCategories?.Select(sc => sc.Name).ToList() ?? new(),
                UpdateDate = category.UpdateDate,
                UpdatedBy = category.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
