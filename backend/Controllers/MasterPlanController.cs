using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Dtos.Unit;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("master-plan")]
    public class MasterPlanController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public MasterPlanController(
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
            [FromQuery] bool? isHidden = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var lang = await GetLangAsync();

            IQueryable<MasterPlan> query = _context
                .MasterPlans.Include(mp => mp.Fields)
                .Include(mp => mp.Elements);

            if (isHidden.HasValue)
            {
                query = query.Where(mp => mp.IsHidden == isHidden.Value);
            }

            if (unitIds?.Any() == true)
                query = query.Where(mp =>
                    _context.Units.Any(u => u.MasterPlanId == mp.Id && unitIds.Contains(u.Id))
                );

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(mp => mp.Name.ToLower().Contains(lowered));
            }

            query = sortBy.ToLower() switch
            {
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(mp => mp.Name.ToLower())
                    : query.OrderBy(mp => mp.Name.ToLower()),
                "unitcount" => sortOrder == "desc"
                    ? query.OrderByDescending(mp =>
                        _context.Units.Count(u => u.MasterPlanId == mp.Id)
                    )
                    : query.OrderBy(mp => _context.Units.Count(u => u.MasterPlanId == mp.Id)),
                "visibilitycount" => sortOrder == "desc"
                    ? query.OrderByDescending(mp => mp.IsHidden)
                    : query.OrderBy(mp => mp.IsHidden),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(mp => mp.Id)
                    : query.OrderBy(mp => mp.Id),
            };

            var totalCount = await query.CountAsync();

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = await _context.MasterPlans.CountAsync(mp => !mp.IsHidden),
                ["Hidden"] = await _context.MasterPlans.CountAsync(mp => mp.IsHidden),
            };

            var unitCount = await _context
                .Units.Where(u => u.MasterPlanId != null)
                .GroupBy(u => u.MasterPlanId!.Value)
                .Select(g => new { MasterPlanId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MasterPlanId, x => x.Count);

            var masterPlans = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new MasterPlanDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Units = _context
                        .Units.Where(u => u.MasterPlanId == t.Id)
                        .Select(u => new UnitDto
                        {
                            Id = u.Id,
                            Name = u.Name,
                            UnitGroupName = u.UnitGroup != null ? u.UnitGroup.Name : "",
                        })
                        .ToList(),
                    IsHidden = t.IsHidden,
                    Fields = new List<MasterPlanFieldDto>(),
                    Elements = new List<MasterPlanElementDto>(),

                    // Meta data.
                    CreationDate = t.CreationDate,
                    CreatedBy = t.CreatedBy,
                    UpdateDate = t.UpdateDate,
                    UpdatedBy = t.UpdatedBy,
                })
                .ToListAsync();

            var result = new
            {
                totalCount,
                items = masterPlans,
                counts = new { visibilityCount, unitCount },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetMasterPlan(int id)
        {
            var lang = await GetLangAsync();
            var masterPlan = await _context
                .MasterPlans.Include(m => m.Fields)
                .Include(m => m.Elements)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            var result = new MasterPlanDto
            {
                Id = masterPlan.Id,
                Name = masterPlan.Name,
                Units = await _context
                    .Units.Where(u => u.MasterPlanId == masterPlan.Id)
                    .Select(u => new UnitDto
                    {
                        Id = u.Id,
                        Name = u.Name,
                        UnitGroupName = u.UnitGroup != null ? u.UnitGroup.Name : "",
                    })
                    .ToListAsync(),
                IsHidden = masterPlan.IsHidden,
                Fields = masterPlan
                    .Fields.Select(f => new MasterPlanFieldDto { Id = f.Id, Name = f.Name })
                    .ToList(),
                Elements = new List<MasterPlanElementDto>(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMasterPlan(int id)
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
            var masterPlan = await _context.MasterPlans.FindAsync(id);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "MasterPlan",
                masterPlan.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = masterPlan.Id,
                    ["Name"] = masterPlan.Name,
                    ["IsHidden"] = masterPlan.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            _context.MasterPlans.Remove(masterPlan);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("MasterPlan/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateMasterPlan(CreateMasterPlanDto dto)
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

            var existingMasterPlan = await _context.MasterPlans.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower()
            );

            if (existingMasterPlan != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlan/NameTaken", lang) }
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

            var masterPlan = new MasterPlan
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.MasterPlans.Add(masterPlan);
            await _context.SaveChangesAsync();

            var result = new MasterPlanDto
            {
                Id = masterPlan.Id,
                Name = masterPlan.Name,
                IsHidden = masterPlan.IsHidden,

                // Meta data.
                CreationDate = masterPlan.CreationDate,
                CreatedBy = masterPlan.CreatedBy,
                UpdateDate = masterPlan.UpdateDate,
                UpdatedBy = masterPlan.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "MasterPlan",
                masterPlan.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = masterPlan.Id,
                    ["Name"] = masterPlan.Name,
                    ["IsHidden"] = masterPlan.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMasterPlan(int id, UpdateMasterPlanDto dto)
        {
            var lang = await GetLangAsync();
            var masterPlan = await _context.MasterPlans.FindAsync(id);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
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

            var existingMasterPlan = await _context.MasterPlans.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (existingMasterPlan != null)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlan/NameTaken", lang) }
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
                ["ObjectID"] = masterPlan.Id,
                ["Name"] = masterPlan.Name,
                ["IsHidden"] = masterPlan.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
            };

            masterPlan.Name = dto.Name;
            masterPlan.IsHidden = dto.IsHidden;

            // Meta data.
            masterPlan.UpdateDate = now;
            masterPlan.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new MasterPlanDto
            {
                Id = masterPlan.Id,
                Name = masterPlan.Name,
                IsHidden = masterPlan.IsHidden,

                // Meta data.
                UpdateDate = masterPlan.UpdateDate,
                UpdatedBy = masterPlan.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "MasterPlan",
                masterPlan.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = masterPlan.Id,
                        ["Name"] = masterPlan.Name,
                        ["IsHidden"] = masterPlan.IsHidden
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                    },
                }
            );

            return Ok(result);
        }
    }
}
