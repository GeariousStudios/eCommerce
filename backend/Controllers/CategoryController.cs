using backend.Data;
using backend.Dtos.User;
using backend.Models;
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

        public CategoryController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<Category> query = _context.Categories.Include(c => c.SubCategories);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(lowered)
                    || c.SubCategories.Any(sc => sc.Name.ToLower().Contains(lowered))
                );
            }

            var filteredSubCategoryCount = await query
                .SelectMany(c => c.SubCategories)
                .CountAsync();

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Name)
                    : query.OrderBy(c => c.Name),
                "subCategories" => sortOrder == "desc"
                    ? query.OrderByDescending(c =>
                        c.SubCategories.OrderBy(sc => sc.Name)
                            .Select(sc => sc.Name)
                            .FirstOrDefault()
                    )
                    : query.OrderBy(c =>
                        c.SubCategories.OrderBy(sc => sc.Name)
                            .Select(sc => sc.Name)
                            .FirstOrDefault()
                    ),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Id)
                    : query.OrderBy(c => c.Id),
            };

            int totalCount = await query.CountAsync();

            List<Category> categories;

            totalCount = await query.CountAsync();
            categories = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var totalSubCategoryCount = await _context
                .Categories.SelectMany(c => c.SubCategories)
                .CountAsync();

            var result = new
            {
                totalCount,
                items = categories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SubCategories = c.SubCategories.Select(sc => sc.Name).ToArray(),
                }),
                counts = new
                {
                    subCategories = totalSubCategoryCount,

                    // Filtered.
                    filteredsubCategories = filteredSubCategoryCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "Kategorin kunde inte hittas i databasen" });
            }

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                SubCategories = category.SubCategories.Select(sc => sc.Name).ToArray(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new { message = "Användaren kunde inte hittas i databasen" });
            }

            // if (category.InUse)
            // {
            //     return BadRequest(new { message = "Kan inte ta bort en kategori som används!" });
            // }

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

            var category = new Category
            {
                Name = dto.Name,
                SubCategories = dto
                    .SubCategories.Select(name => new SubCategory { Name = name })
                    .ToArray(),
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                SubCategories = category.SubCategories.Select(sc => sc.Name).ToArray(),
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(id);

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

            category.Name = dto.Name;
            category.SubCategories = dto
                .SubCategories.Select(name => new SubCategory { Name = name })
                .ToArray();

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                SubCategories = category.SubCategories.Select(sc => sc.Name).ToArray(),
            };

            await _context.SaveChangesAsync();
            return Ok(result);
        }
    }
}
