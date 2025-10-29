using System.Security.Cryptography;
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
    [Route("category")]
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public CategoryController(
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
            [FromQuery] bool? hasSubCategories = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var efQuery = _context
                .Categories.Include(c => c.CategoryToSubCategories)
                .ThenInclude(csc => csc.SubCategory)
                .Include(c => c.UnitToCategories)
                .ThenInclude(uc => uc.Unit)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                efQuery = efQuery.Where(c =>
                    c.Name.ToLower().Contains(lowered)
                    || (
                        c.CategoryToSubCategories.Any(csc =>
                            csc.SubCategory.Name.ToLower().Contains(lowered)
                        )
                    )
                );
            }

            if (hasSubCategories.HasValue)
            {
                if (hasSubCategories.Value)
                {
                    efQuery = efQuery.Where(c => c.CategoryToSubCategories.Any());
                }
                else
                {
                    efQuery = efQuery.Where(c => !c.CategoryToSubCategories.Any());
                }
            }

            if (unitIds?.Any() == true)
            {
                efQuery = efQuery.Where(c =>
                    c.UnitToCategories.Any(uc => unitIds.Contains(uc.UnitId))
                );
            }

            var totalCount = await efQuery.CountAsync();
            var query = efQuery.AsEnumerable();

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Name.ToLower())
                    : query.OrderBy(c => c.Name),
                "subcategorycount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(c => c.CategoryToSubCategories.Count)
                        .ThenBy(c => c.Name.ToLower())
                    : query
                        .OrderBy(c => c.CategoryToSubCategories.Count)
                        .ThenBy(c => c.Name.ToLower()),
                "unitcount" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(c => c.UnitToCategories.Count)
                        .ThenBy(c => c.Name.ToLower())
                    : query.OrderBy(c => c.UnitToCategories.Count).ThenBy(c => c.Name.ToLower()),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(c => c.Id)
                    : query.OrderBy(c => c.Id),
            };

            var categories = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            // Filters.
            var subCategoryCount = new Dictionary<string, int>
            {
                ["With"] = await _context.Categories.CountAsync(c =>
                    c.CategoryToSubCategories.Any()
                ),
                ["Without"] = await _context.Categories.CountAsync(c =>
                    !c.CategoryToSubCategories.Any()
                ),
            };

            var subCategories = _context
                .CategoryToSubCategories.GroupBy(csc => csc.SubCategoryId)
                .ToDictionary(g => g.Key, g => g.Count());

            var unitCount = _context
                .UnitToCategories.GroupBy(uc => uc.UnitId)
                .ToDictionary(g => g.Key, g => g.Count());

            var result = new
            {
                totalCount,
                items = categories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    SubCategories = c
                        .CategoryToSubCategories.OrderBy(csc => csc.Order)
                        .Select(csc => new SubCategoryDto
                        {
                            Id = csc.SubCategory.Id,
                            Name = csc.SubCategory.Name,
                        })
                        .ToList(),
                    Units =
                        c.UnitToCategories.Select(uc => uc.Unit)
                            .Select(u => new UnitDto
                            {
                                Id = u.Id,
                                Name = u.Name,
                                UnitGroupId = u.UnitGroupId,
                                UnitGroupName = u.UnitGroup?.Name ?? "",
                                IsHidden = u.IsHidden,
                                UnitColumnIds = u
                                    .UnitToUnitColumns.OrderBy(uuc => uuc.Order)
                                    .Select(uuc => uuc.UnitColumnId)
                                    .ToList(),
                                CategoryIds = u
                                    .UnitToCategories.OrderBy(uc => uc.Order)
                                    .Select(uc => uc.CategoryId)
                                    .ToList(),
                                CreationDate = u.CreationDate,
                                CreatedBy = u.CreatedBy,
                                UpdateDate = u.UpdateDate,
                                UpdatedBy = u.UpdatedBy,
                            })
                            .ToList() ?? new(),

                    // Meta data.
                    CreationDate = c.CreationDate,
                    CreatedBy = c.CreatedBy,
                    UpdateDate = c.UpdateDate,
                    UpdatedBy = c.UpdatedBy,
                }),
                counts = new
                {
                    subCategoryCount = subCategoryCount,
                    subCategories = subCategories,
                    unitCount = unitCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var lang = await GetLangAsync();
            var category = await _context
                .Categories.Include(c => c.UnitToCategories)
                .ThenInclude(uc => uc.Unit)
                .Include(c => c.CategoryToSubCategories)
                .ThenInclude(csc => csc.SubCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = await _t.GetAsync("Category/NotFound", lang) });
            }

            var result = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Units = category
                    .UnitToCategories.Select(uc => uc.Unit)
                    .Select(u => new UnitDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        UnitGroupId = u.UnitGroupId,
                        UnitGroupName = u.UnitGroup?.Name ?? "",
                        IsHidden = u.IsHidden,
                        UnitColumnIds = u
                            .UnitToUnitColumns.OrderBy(uuc => uuc.Order)
                            .Select(uuc => uuc.UnitColumnId)
                            .ToList(),
                        CategoryIds = u
                            .UnitToCategories.OrderBy(uc => uc.Order)
                            .Select(uc => uc.CategoryId)
                            .ToList(),
                        CreationDate = u.CreationDate,
                        CreatedBy = u.CreatedBy,
                        UpdateDate = u.UpdateDate,
                        UpdatedBy = u.UpdatedBy,
                    })
                    .ToList(),
                SubCategories = category
                    .CategoryToSubCategories.OrderBy(csc => csc.Order)
                    .Select(csc => new SubCategoryDto
                    {
                        Id = csc.SubCategory.Id,
                        Name = csc.SubCategory.Name,
                        CategoryIds = csc
                            .SubCategory.CategoryToSubCategories.Select(csc => csc.CategoryId)
                            .ToList(),
                    })
                    .ToList(),
            };

            return Ok(result);
        }

        [HttpGet("unit/{unitId}")]
        public async Task<IActionResult> GetCategoriesForUnit(int unitId)
        {
            var unitToCategories = await _context
                .UnitToCategories.Where(uc => uc.UnitId == unitId)
                .OrderBy(uc => uc.Order)
                .Include(uc => uc.Category)
                .ThenInclude(c => c.CategoryToSubCategories)
                .ThenInclude(csc => csc.SubCategory)
                .ToListAsync();

            var result = unitToCategories
                .Select(uc => new CategoryDto
                {
                    Id = uc.Category.Id,
                    Name = uc.Category.Name,
                    SubCategories = uc
                        .Category.CategoryToSubCategories.OrderBy(csc => csc.Order)
                        .Select(csc => new SubCategoryDto
                        {
                            Id = csc.SubCategory.Id,
                            Name = csc.SubCategory.Name,
                        })
                        .ToList(),
                    CreationDate = uc.Category.CreationDate,
                    CreatedBy = uc.Category.CreatedBy,
                    UpdateDate = uc.Category.UpdateDate,
                    UpdatedBy = uc.Category.UpdatedBy,
                })
                .ToList();

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
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
            var category = await _context
                .Categories.Include(c => c.UnitToCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = await _t.GetAsync("Category/NotFound", lang) });
            }

            var isInUse = category.UnitToCategories != null && category.UnitToCategories.Any();

            if (isInUse)
            {
                return BadRequest(new { message = await _t.GetAsync("Category/InUse", lang) });
            }

            var subCategoryIds = category
                .CategoryToSubCategories.Select(csc => csc.SubCategoryId)
                .ToList();

            _context.CategoryToSubCategories.RemoveRange(category.CategoryToSubCategories);

            var subCategoriesToCheck = await _context
                .SubCategories.Include(sc => sc.CategoryToSubCategories)
                .Where(sc => subCategoryIds.Contains(sc.Id))
                .ToListAsync();

            var subCategoriesToDelete = subCategoriesToCheck
                .Where(sc => sc.CategoryToSubCategories.Count == 1)
                .ToList();

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "Category",
                category.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = category.Id,
                    ["Name"] = category.Name,
                    ["SubCategories"] = string.Join(
                        "<br>",
                        subCategoriesToDelete.Select(sc => $"{sc.Name} (ID: {sc.Id})")
                    ),
                }
            );

            _context.SubCategories.RemoveRange(subCategoriesToDelete);
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("Category/Deleted", lang) });
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateCategory(CreateCategoryDto dto)
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

            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c =>
                c.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingCategory != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Category/NameTaken", lang) });
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

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var finalSubCategoryIds = new List<int>();

                if (dto.SubCategoryIds?.Any() == true)
                {
                    var subCategoryIds = dto.SubCategoryIds!;
                    var existingSubCategories = await _context
                        .SubCategories.Where(sc => subCategoryIds.Contains(sc.Id))
                        .ToListAsync();

                    if (existingSubCategories.Count != subCategoryIds.Length)
                        return BadRequest(
                            new { message = await _t.GetAsync("SubCategory/SomeNotFound", lang) }
                        );

                    finalSubCategoryIds.AddRange(subCategoryIds);
                }

                var newSubCategories = new List<SubCategory>();

                if (dto.NewSubCategoryNames?.Any() == true)
                {
                    foreach (
                        var name in dto.NewSubCategoryNames.Where(n =>
                            !string.IsNullOrWhiteSpace(n)
                        )
                    )
                    {
                        var trimmed = name.Trim();

                        var conflictingSubCategory = await _context
                            .SubCategories.Include(sc => sc.CategoryToSubCategories)
                            .ThenInclude(csc => csc.Category)
                            .FirstOrDefaultAsync(sc =>
                                sc.Name.ToLower() == trimmed.ToLower()
                                && sc.CategoryToSubCategories.Any(csc =>
                                    csc.Category.Name.ToLower() == dto.Name.ToLower()
                                )
                            );

                        if (conflictingSubCategory != null)
                        {
                            var template = await _t.GetAsync("SubCategory/ExistsInCategory", lang);
                            return BadRequest(new { message = string.Format(template, trimmed) });
                        }

                        var newSubCategory = new SubCategory
                        {
                            Name = trimmed,
                            CreationDate = now,
                            CreatedBy = createdBy,
                            UpdateDate = now,
                            UpdatedBy = createdBy,
                        };

                        newSubCategories.Add(newSubCategory);
                    }

                    if (newSubCategories.Any())
                    {
                        _context.SubCategories.AddRange(newSubCategories);
                        await _context.SaveChangesAsync();
                        finalSubCategoryIds.AddRange(newSubCategories.Select(sc => sc.Id));
                    }
                }

                var orderedSubCategoryIds = new List<int>();

                foreach (var tempId in (dto.OrderedSubCategoryIds ?? Array.Empty<int>()))
                {
                    if (tempId > 0)
                    {
                        orderedSubCategoryIds.Add(tempId);
                    }
                    else if (
                        dto.TempSubCategoryNames != null
                        && dto.TempSubCategoryNames.TryGetValue(tempId, out var name)
                    )
                    {
                        var match = newSubCategories.FirstOrDefault(sc =>
                            sc.Name.Equals(name.Trim(), StringComparison.OrdinalIgnoreCase)
                        );
                        if (match != null)
                            orderedSubCategoryIds.Add(match.Id);
                    }
                }

                var category = new Category
                {
                    Name = dto.Name,
                    CategoryToSubCategories = orderedSubCategoryIds
                        .Where(id => finalSubCategoryIds.Contains(id))
                        .Select(
                            (id, index) =>
                                new CategoryToSubCategory { SubCategoryId = id, Order = index }
                        )
                        .ToList(),

                    // Meta data.
                    CreationDate = now,
                    CreatedBy = createdBy,
                    UpdateDate = now,
                    UpdatedBy = createdBy,
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var result = new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Units = new List<UnitDto>(),
                    SubCategories = category
                        .CategoryToSubCategories.OrderBy(csc => csc.Order)
                        .Select(csc => new SubCategoryDto
                        {
                            Id = csc.SubCategoryId,
                            Name = _context
                                .SubCategories.First(sc => sc.Id == csc.SubCategoryId)
                                .Name,
                        })
                        .ToList(),

                    // Meta data.
                    CreationDate = category.CreationDate,
                    CreatedBy = category.CreatedBy,
                    UpdateDate = category.UpdateDate,
                    UpdatedBy = category.UpdatedBy,
                };

                // Audit trail.
                await _audit.LogAsync(
                    "Create",
                    "Category",
                    category.Id,
                    createdBy,
                    userId,
                    new Dictionary<string, object?>
                    {
                        ["ObjectID"] = category.Id,
                        ["Name"] = category.Name,
                        ["SubCategories"] = string.Join(
                            "<br>",
                            _context
                                .SubCategories.Where(sc => finalSubCategoryIds.Contains(sc.Id))
                                .Select(sc => $"{sc.Name} (ID: {sc.Id})")
                        ),
                    }
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var prefix = await _t.GetAsync("Common/ErrorPrefix", await GetLangAsync());
                return StatusCode(500, new { message = prefix + ex.Message });
            }
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto dto)
        {
            var lang = await GetLangAsync();
            var category = await _context
                .Categories.Include(c => c.CategoryToSubCategories)
                .ThenInclude(csc => csc.SubCategory)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return NotFound(new { message = await _t.GetAsync("Category/NotFound", lang) });

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

            var existingCategory = await _context.Categories.FirstOrDefaultAsync(c =>
                c.Name.ToLower() == dto.Name.ToLower() && c.Id != id
            );

            if (existingCategory != null)
                return BadRequest(new { message = await _t.GetAsync("Category/NameTaken", lang) });

            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var finalSubCategoryIds = new List<int>();

                if (dto.SubCategoryIds?.Any() == true)
                {
                    var subCategoryIds = dto.SubCategoryIds!;
                    var existingSubCategories = await _context
                        .SubCategories.Where(sc => subCategoryIds.Contains(sc.Id))
                        .ToListAsync();

                    if (existingSubCategories.Count != subCategoryIds.Length)
                        return BadRequest(
                            new { message = await _t.GetAsync("SubCategory/SomeNotFound", lang) }
                        );

                    finalSubCategoryIds.AddRange(subCategoryIds);
                }

                var newSubCategories = new List<SubCategory>();

                if (dto.NewSubCategoryNames?.Any() == true)
                {
                    foreach (
                        var name in dto.NewSubCategoryNames.Where(n =>
                            !string.IsNullOrWhiteSpace(n)
                        )
                    )
                    {
                        var trimmed = name.Trim();

                        var duplicate = await _context
                            .SubCategories.Include(sc => sc.CategoryToSubCategories)
                            .Where(sc => sc.Name.ToLower() == trimmed.ToLower())
                            .AnyAsync(sc =>
                                sc.CategoryToSubCategories.Any(csc => csc.CategoryId == category.Id)
                            );

                        if (duplicate)
                        {
                            var template = await _t.GetAsync("SubCategory/ExistsInCategory", lang);
                            return BadRequest(new { message = string.Format(template, trimmed) });
                        }

                        var newSubCategory = new SubCategory
                        {
                            Name = trimmed,

                            // Meta data.
                            CreationDate = now,
                            CreatedBy = updatedBy,
                            UpdateDate = now,
                            UpdatedBy = updatedBy,
                        };

                        newSubCategories.Add(newSubCategory);
                    }

                    if (newSubCategories.Any())
                    {
                        _context.SubCategories.AddRange(newSubCategories);
                        await _context.SaveChangesAsync();
                        finalSubCategoryIds.AddRange(newSubCategories.Select(sc => sc.Id));
                    }
                }

                if (dto.UpdatedExistingSubCategories?.Any() == true)
                {
                    foreach (var updatedSub in dto.UpdatedExistingSubCategories)
                    {
                        var subCategory = await _context.SubCategories.FirstOrDefaultAsync(s =>
                            s.Id == updatedSub.Id
                        );
                        if (subCategory == null)
                            continue;

                        var trimmed = updatedSub.Name.Trim();
                        if (subCategory.Name != trimmed)
                        {
                            var exists = await _context.SubCategories.AnyAsync(sc =>
                                sc.Id != updatedSub.Id && sc.Name.ToLower() == trimmed.ToLower()
                            );

                            if (exists)
                            {
                                var template = await _t.GetAsync("SubCategory/NameTaken", lang);
                                return BadRequest(
                                    new { message = string.Format(template, trimmed) }
                                );
                            }

                            subCategory.Name = trimmed;
                            subCategory.UpdateDate = now;
                            subCategory.UpdatedBy = updatedBy;
                        }
                    }
                }

                if (dto.SubCategoryIdsToDelete?.Any() == true)
                {
                    var subsToDelete = await _context
                        .SubCategories.Include(sc => sc.CategoryToSubCategories)
                        .Where(sc =>
                            dto.SubCategoryIdsToDelete.Contains(sc.Id)
                            && sc.CategoryToSubCategories.All(csc => csc.CategoryId == category.Id)
                        )
                        .ToListAsync();

                    _context.SubCategories.RemoveRange(subsToDelete);
                }

                var orderedSubCategoryIds = new List<int>();
                var createdIdsQueue = new Queue<int>(newSubCategories.Select(sc => sc.Id));
                var incomingOrder =
                    (dto.OrderedSubCategoryIds != null && dto.OrderedSubCategoryIds.Any())
                        ? dto.OrderedSubCategoryIds.ToList()
                        : finalSubCategoryIds.ToList();

                foreach (var subId in incomingOrder)
                {
                    if (subId > 0)
                        orderedSubCategoryIds.Add(subId);
                    else if (createdIdsQueue.Count > 0)
                        orderedSubCategoryIds.Add(createdIdsQueue.Dequeue());
                }

                _context.CategoryToSubCategories.RemoveRange(category.CategoryToSubCategories);
                category.CategoryToSubCategories = orderedSubCategoryIds
                    .Where(id => finalSubCategoryIds.Contains(id))
                    .Select(
                        (id, index) =>
                            new CategoryToSubCategory
                            {
                                CategoryId = category.Id,
                                SubCategoryId = id,
                                Order = index,
                            }
                    )
                    .ToList();

                category.Name = dto.Name;
                category.UpdateDate = now;
                category.UpdatedBy = updatedBy;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var result = new CategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Units = new List<UnitDto>(),
                    SubCategories = category
                        .CategoryToSubCategories.OrderBy(x => x.Order)
                        .Select(csc => new SubCategoryDto
                        {
                            Id = csc.SubCategoryId,
                            Name = _context
                                .SubCategories.First(sc => sc.Id == csc.SubCategoryId)
                                .Name,
                        })
                        .ToList(),

                    // Meta data.
                    UpdateDate = category.UpdateDate,
                    UpdatedBy = category.UpdatedBy,
                };

                // Audit trail.
                await _audit.LogAsync(
                    "Update",
                    "Category",
                    category.Id,
                    updatedBy,
                    userId,
                    new
                    {
                        NewValues = new Dictionary<string, object?>
                        {
                            ["ObjectID"] = category.Id,
                            ["Name"] = category.Name,
                            ["SubCategories"] = string.Join(
                                "<br>",
                                _context
                                    .SubCategories.Where(sc => finalSubCategoryIds.Contains(sc.Id))
                                    .Select(sc => $"{sc.Name} (ID: {sc.Id})")
                            ),
                        },
                    }
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var prefix = await _t.GetAsync("Common/ErrorPrefix", await GetLangAsync());
                return StatusCode(500, new { message = prefix + ex.Message });
            }
        }
    }
}
