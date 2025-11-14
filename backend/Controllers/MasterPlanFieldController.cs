using backend.Data;
using backend.Dtos.Category;
using backend.Dtos.MasterPlan;
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
    [Route("master-plan-field")]
    public class MasterPlanFieldController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public MasterPlanFieldController(
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
            [FromQuery] string[]? dataType = null,
            [FromQuery] string[]? alignment = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] int[]? masterPlanIds = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var lang = await GetLangAsync();

            IQueryable<MasterPlanField> query = _context
                .MasterPlanFields.Include(mpf => mpf.MasterPlanToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlan);

            if (isHidden.HasValue)
            {
                query = query.Where(mp => mp.IsHidden == isHidden.Value);
            }

            if (masterPlanIds?.Any() == true)
            {
                query = query.Where(mp =>
                    mp.MasterPlanToMasterPlanFields.Any(mp =>
                        masterPlanIds.Contains(mp.MasterPlanId)
                    )
                );
            }

            var parsedDataTypes = dataType
                ?.Select(x => Enum.Parse<MasterPlanFieldDataType>(x))
                .ToArray();

            var parsedAlignments = alignment
                ?.Select(x => Enum.Parse<MasterPlanFieldAlignment>(x))
                .ToArray();

            if (parsedDataTypes != null && parsedDataTypes.Length > 0)
            {
                query = query.Where(m => parsedDataTypes.Contains(m.DataType));
            }

            if (parsedAlignments != null && parsedAlignments.Length > 0)
            {
                query = query.Where(m => parsedAlignments.Contains(m.Alignment));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(mp => mp.Name.ToLower().Contains(lowered));
            }

            var list = await query.ToListAsync();

            if (sortBy.ToLower() == "datatype")
            {
                list =
                    sortOrder == "desc"
                        ? list.OrderByDescending(x =>
                                _t.GetAsync($"AuditTrail/{x.DataType}", lang).Result
                            )
                            .ToList()
                        : list.OrderBy(x => _t.GetAsync($"AuditTrail/{x.DataType}", lang).Result)
                            .ToList();
            }
            else if (sortBy.ToLower() == "alignment")
            {
                list =
                    sortOrder == "desc"
                        ? list.OrderByDescending(x =>
                                _t.GetAsync($"AuditTrail/{x.Alignment}", lang).Result
                            )
                            .ToList()
                        : list.OrderBy(x => _t.GetAsync($"AuditTrail/{x.Alignment}", lang).Result)
                            .ToList();
            }
            else
            {
                list = sortBy.ToLower() switch
                {
                    "name" => sortOrder == "desc"
                        ? list.OrderByDescending(x => x.Name.ToLower()).ToList()
                        : list.OrderBy(x => x.Name.ToLower()).ToList(),

                    "masterplancount" => sortOrder == "desc"
                        ? list.OrderByDescending(x => x.MasterPlanToMasterPlanFields.Count).ToList()
                        : list.OrderBy(x => x.MasterPlanToMasterPlanFields.Count).ToList(),

                    "visibilitycount" => sortOrder == "desc"
                        ? list.OrderByDescending(x => x.IsHidden).ToList()
                        : list.OrderBy(x => x.IsHidden).ToList(),

                    _ => sortOrder == "desc"
                        ? list.OrderByDescending(x => x.Id).ToList()
                        : list.OrderBy(x => x.Id).ToList(),
                };
            }

            var totalCount = list.Count;

            // Filters.
            var visibilityCount = new Dictionary<string, int>
            {
                ["Visible"] = list.Count(mpf => !mpf.IsHidden),
                ["Hidden"] = list.Count(mpf => mpf.IsHidden),
            };

            var masterPlanCount = list.SelectMany(mpf => mpf.MasterPlanToMasterPlanFields)
                .GroupBy(uuc => uuc.MasterPlanId)
                .ToDictionary(g => g.Key, g => g.Count());

            var dataTypeCount = list.GroupBy(mpf => mpf.DataType)
                .ToDictionary(g => g.Key, g => g.Count());

            var alignmentCount = list.GroupBy(mpf => mpf.Alignment)
                .ToDictionary(g => g.Key, g => g.Count());

            var masterPlanFields = list.Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new MasterPlanFieldDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    DataType = t.DataType,
                    Alignment = t.Alignment,
                    MasterPlanIds = t
                        .MasterPlanToMasterPlanFields.Select(mpf => mpf.MasterPlanId)
                        .OrderBy(id => id)
                        .ToList(),
                    IsHidden = t.IsHidden,

                    // Meta data.
                    CreationDate = t.CreationDate,
                    CreatedBy = t.CreatedBy,
                    UpdateDate = t.UpdateDate,
                    UpdatedBy = t.UpdatedBy,
                })
                .ToList();

            var result = new
            {
                totalCount,
                items = masterPlanFields,
                counts = new
                {
                    visibilityCount,
                    masterPlanCount,
                    dataTypeCount,
                    alignmentCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetMasterPlanField(int id)
        {
            var lang = await GetLangAsync();
            var masterPlanField = await _context
                .MasterPlanFields.Include(m => m.MasterPlanToMasterPlanFields)
                .ThenInclude(mp => mp.MasterPlan)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (masterPlanField == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanField/NotFound", lang) }
                );
            }

            var result = new MasterPlanFieldDto
            {
                Id = masterPlanField.Id,
                Name = masterPlanField.Name,
                DataType = masterPlanField.DataType,
                Alignment = masterPlanField.Alignment,
                IsHidden = masterPlanField.IsHidden,
                MasterPlanIds = masterPlanField
                    .MasterPlanToMasterPlanFields.Select(m => m.MasterPlanId)
                    .ToList(),
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMasterPlanField(int id)
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

            var field = await _context
                .MasterPlanFields.Include(f => f.MasterPlanToMasterPlanFields)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (field == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanField/NotFound", lang) }
                );
            }

            if (field.MasterPlanToMasterPlanFields.Any())
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlanField/InUse", lang) }
                );
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "MasterPlanField",
                field.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = field.Id,
                    ["Name"] = field.Name,
                    ["DataType"] = field.DataType.ToString(),
                    ["Alignment"] = field.Alignment.ToString(),
                    ["IsHidden"] = field.IsHidden ? "Common/Yes" : "Common/No",
                }
            );

            _context.MasterPlanFields.Remove(field);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("MasterPlanField/Deleted", lang) });
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateMasterPlanField(CreateMasterPlanFieldDto dto)
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

            var field = new MasterPlanField
            {
                Name = dto.Name,
                DataType = dto.DataType,
                Alignment = dto.Alignment,
                IsHidden = dto.IsHidden,
                MasterPlanToMasterPlanFields =
                    dto.MasterPlanIds != null
                        ? dto
                            .MasterPlanIds.Select(id => new MasterPlanToMasterPlanField
                            {
                                MasterPlanId = id,
                            })
                            .ToList()
                        : new List<MasterPlanToMasterPlanField>(),

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.MasterPlanFields.Add(field);
            await _context.SaveChangesAsync();

            var result = new MasterPlanFieldDto
            {
                Id = field.Id,
                Name = field.Name,
                DataType = field.DataType,
                Alignment = field.Alignment,
                IsHidden = field.IsHidden,
                MasterPlanIds = field
                    .MasterPlanToMasterPlanFields.Select(m => m.MasterPlanId)
                    .ToList(),

                // Meta data.
                CreationDate = field.CreationDate,
                CreatedBy = field.CreatedBy,
                UpdateDate = field.UpdateDate,
                UpdatedBy = field.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "MasterPlanField",
                field.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = field.Id,
                    ["Name"] = field.Name,
                    ["DataType"] = field.DataType.ToString(),
                    ["Alignment"] = field.Alignment.ToString(),
                    ["IsHidden"] = field.IsHidden ? "Common/Yes" : "Common/No",
                }
            );

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateMasterPlanField(int id, UpdateMasterPlanFieldDto dto)
        {
            var lang = await GetLangAsync();
            var field = await _context
                .MasterPlanFields.Include(f => f.MasterPlanToMasterPlanFields)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (field == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanField/NotFound", lang) }
                );
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

            var existsWithSameName = await _context.MasterPlanFields.AnyAsync(f =>
                f.Id != id && f.Name.ToLower() == dto.Name.ToLower()
            );

            if (existsWithSameName)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlanField/NameTaken", lang) }
                );
            }

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = field.Id,
                ["Name"] = field.Name,
                ["DataType"] = field.DataType.ToString(),
                ["Alignment"] = field.Alignment.ToString(),
                ["IsHidden"] = field.IsHidden ? "Common/Yes" : "Common/No",
            };

            field.Name = dto.Name;
            field.DataType = dto.DataType;
            field.Alignment = dto.Alignment;
            field.IsHidden = dto.IsHidden;

            _context.MasterPlanToMasterPlanFields.RemoveRange(field.MasterPlanToMasterPlanFields);

            field.MasterPlanToMasterPlanFields =
                dto.MasterPlanIds != null
                    ? dto
                        .MasterPlanIds.Select(id => new MasterPlanToMasterPlanField
                        {
                            MasterPlanId = id,
                            MasterPlanFieldId = field.Id,
                        })
                        .ToList()
                    : new List<MasterPlanToMasterPlanField>();

            // Meta data.
            field.UpdateDate = now;
            field.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new MasterPlanFieldDto
            {
                Id = field.Id,
                Name = field.Name,
                DataType = field.DataType,
                Alignment = field.Alignment,
                IsHidden = field.IsHidden,
                MasterPlanIds = field
                    .MasterPlanToMasterPlanFields.Select(m => m.MasterPlanId)
                    .ToList(),

                // Meta data.
                UpdateDate = field.UpdateDate,
                UpdatedBy = field.UpdatedBy,
            };

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "MasterPlanField",
                field.Id,
                updatedBy,
                userId,
                new
                {
                    OldValues = oldValues,
                    NewValues = new Dictionary<string, object?>
                    {
                        ["ObjectID"] = field.Id,
                        ["Name"] = field.Name,
                        ["DataType"] = field.DataType.ToString(),
                        ["Alignment"] = field.Alignment.ToString(),
                        ["IsHidden"] = field.IsHidden ? "Common/Yes" : "Common/No",
                    },
                }
            );

            return Ok(result);
        }
    }
}
