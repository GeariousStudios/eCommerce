using backend.Data;
using backend.Dtos.Category;
using backend.Dtos.SubCategory;
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
    [Authorize(Roles = "Admin")]
    [Route("sub-category")]
    public class SubCategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public SubCategoryController(
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
        public async Task<IActionResult> GetAll()
        {
            var subCategories = await _context
                .SubCategories.OrderBy(sc => sc.Name)
                .Select(sc => new SubCategoryDto { Id = sc.Id, Name = sc.Name })
                .ToListAsync();

            return Ok(subCategories);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteSubCategory(int id)
        {
            var lang = await GetLangAsync();
            var subCategory = await _context
                .SubCategories.Include(c => c.CategoryToSubCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (subCategory == null)
            {
                return NotFound(new { message = await _t.GetAsync("SubCategory/NotFound", lang) });
            }

            // var isInUse =
            //     subCategory.CategoryToSubCategories != null
            //     && subCategory.CategoryToSubCategories.Any();

            // if (isInUse)
            // {
            //     return BadRequest(
            //         new { message = "Kan inte ta bort en underkategori som används" }
            //     );
            // }

            _context.SubCategories.Remove(subCategory);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("SubCategory/Deleted", lang) });
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateSubCategory(CreateSubCategoryDto dto)
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

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var subCategory = new SubCategory
            {
                Name = dto.Name,
                CategoryToSubCategories =
                    dto.CategoryIds != null
                        ? dto
                            .CategoryIds.Select(id => new CategoryToSubCategory { CategoryId = id })
                            .ToList()
                        : new List<CategoryToSubCategory>(),

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.SubCategories.Add(subCategory);
            await _context.SaveChangesAsync();

            var result = new SubCategoryDto
            {
                Id = subCategory.Id,
                Name = subCategory.Name,
                CategoryIds = subCategory
                    .CategoryToSubCategories.Select(csc => csc.CategoryId)
                    .ToList(),

                // Meta data.
                CreationDate = subCategory.CreationDate,
                CreatedBy = subCategory.CreatedBy,
                UpdateDate = subCategory.UpdateDate,
                UpdatedBy = subCategory.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateSubCategory(int id, UpdateSubCategoryDto dto)
        {
            var lang = await GetLangAsync();
            var subCategory = await _context
                .SubCategories.Include(c => c.CategoryToSubCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (subCategory == null)
            {
                return NotFound(new { message = await _t.GetAsync("SubCategory/NotFound", lang) });
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

            var existsWithSameName = await _context.SubCategories.AnyAsync(sc =>
                sc.Id != id && sc.Name.ToLower() == dto.Name.ToLower()
            );

            if (existsWithSameName)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("SubCategory/NameTaken", lang) }
                );
            }

            subCategory.Name = dto.Name;

            _context.CategoryToSubCategories.RemoveRange(subCategory.CategoryToSubCategories);

            subCategory.CategoryToSubCategories =
                dto.CategoryIds != null
                    ? dto
                        .CategoryIds.Select(id => new CategoryToSubCategory
                        {
                            CategoryId = id,
                            SubCategoryId = subCategory.Id,
                        })
                        .ToList()
                    : new List<CategoryToSubCategory>();

            // Meta data.
            subCategory.UpdateDate = now;
            subCategory.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new SubCategoryDto
            {
                Id = subCategory.Id,
                Name = subCategory.Name,
                CategoryIds = subCategory
                    .CategoryToSubCategories.Select(csc => csc.CategoryId)
                    .ToList(),

                // Meta data.
                UpdateDate = subCategory.UpdateDate,
                UpdatedBy = subCategory.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
