using System.Net.Mail;
using System.Text.Json;
using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Dtos.Unit;
using backend.Hubs;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
        private readonly IHubContext<MasterPlanHub> _hub;

        public MasterPlanController(
            AppDbContext context,
            UserService userService,
            ITranslationService t,
            AuditTrailService audit,
            IHubContext<MasterPlanHub> hub
        )
        {
            _context = context;
            _userService = userService;
            _t = t;
            _audit = audit;
            _hub = hub;
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
            [FromQuery] int[]? unitGroupIds = null,
            [FromQuery] int[]? unitIds = null,
            [FromQuery] int[]? fieldIds = null,
            [FromQuery] bool? isHidden = null,
            [FromQuery] bool? allowRemovingElements = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            var lang = await GetLangAsync();

            IQueryable<MasterPlan> query = _context
                .MasterPlans.Include(mp => mp.UnitGroup)
                .Include(mp => mp.MasterPlanToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .Include(mp => mp.MasterPlanToMasterPlanElements)
                .ThenInclude(mpe => mpe.MasterPlanElement);

            if (isHidden.HasValue)
            {
                query = query.Where(mp => mp.IsHidden == isHidden.Value);
            }

            if (allowRemovingElements.HasValue)
            {
                query = query.Where(mp => mp.AllowRemovingElements == allowRemovingElements.Value);
            }

            if (unitGroupIds?.Any() == true)
            {
                query = query.Where(mp => unitGroupIds.Contains(mp.UnitGroupId));
            }

            if (unitIds?.Any() == true)
                query = query.Where(mp =>
                    _context.Units.Any(u => u.MasterPlanId == mp.Id && unitIds.Contains(u.Id))
                );

            if (fieldIds?.Any() == true)
                query = query.Where(mp =>
                    mp.MasterPlanToMasterPlanFields.Any(mpf =>
                        fieldIds.Contains(mpf.MasterPlanFieldId)
                    )
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
                "unitgroupname" => sortOrder == "desc"
                    ? query
                        .OrderByDescending(mp => mp.UnitGroup.Name)
                        .ThenBy(mp => mp.Name.ToLower())
                    : query.OrderBy(mp => mp.UnitGroup.Name).ThenBy(mp => mp.Name.ToLower()),
                "unitcount" => sortOrder == "desc"
                    ? query.OrderByDescending(mp =>
                        _context.Units.Count(u => u.MasterPlanId == mp.Id)
                    )
                    : query.OrderBy(mp => _context.Units.Count(u => u.MasterPlanId == mp.Id)),
                "fieldcount" => sortOrder == "desc"
                    ? query.OrderByDescending(mp => mp.MasterPlanToMasterPlanFields.Count)
                    : query.OrderBy(mp => mp.MasterPlanToMasterPlanFields.Count),
                "visibilitycount" => sortOrder == "desc"
                    ? query.OrderByDescending(mp => mp.IsHidden)
                    : query.OrderBy(mp => mp.IsHidden),
                "allowremovingelements" => sortOrder == "desc"
                    ? query.OrderByDescending(mp => mp.AllowRemovingElements)
                    : query.OrderBy(mp => mp.AllowRemovingElements),
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

            var allowRemovingElementsCount = new Dictionary<string, int>
            {
                ["Allowed"] = await _context.MasterPlans.CountAsync(mp => mp.AllowRemovingElements),
                ["Disallowed"] = await _context.MasterPlans.CountAsync(mp =>
                    !mp.AllowRemovingElements
                ),
            };

            var unitGroupCount = _context
                .MasterPlans.Include(mp => mp.UnitGroup)
                .AsEnumerable()
                .GroupBy(mp => mp.UnitGroup.Name)
                .ToDictionary(g => g.Key, g => g.Count());

            var unitCount = await _context
                .Units.Where(u => u.MasterPlanId != null)
                .GroupBy(u => u.MasterPlanId!.Value)
                .Select(g => new { MasterPlanId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MasterPlanId, x => x.Count);

            var fieldCount = await _context
                .MasterPlanToMasterPlanFields.GroupBy(mpf => mpf.MasterPlanFieldId)
                .Select(g => new
                {
                    FieldId = g.Key,
                    Count = g.Select(mpf => mpf.MasterPlanId).Distinct().Count(),
                })
                .ToDictionaryAsync(x => x.FieldId, x => x.Count);

            var masterPlans = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsEnumerable()
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
                    AllowRemovingElements = t.AllowRemovingElements,
                    UnitGroupId = t.UnitGroupId,
                    UnitGroupName = t.UnitGroup.Name,
                    Fields = t
                        .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                        .Select(mpf => new MasterPlanFieldDto
                        {
                            Id = mpf.MasterPlanField.Id,
                            Name = mpf.MasterPlanField.Name,
                            DataType = mpf.MasterPlanField.DataType,
                            Alignment = mpf.MasterPlanField.Alignment,
                            IsHidden = mpf.MasterPlanField.IsHidden,
                        })
                        .ToList(),
                    Elements = t
                        .MasterPlanToMasterPlanElements.OrderBy(mpe => mpe.Order)
                        .ThenBy(mpe => mpe.Order)
                        .Select(mpe => new MasterPlanElementDto
                        {
                            Id = mpe.MasterPlanElement.Id,
                            Values = t
                                .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                                .Select(mpf => new MasterPlanElementValueDto
                                {
                                    MasterPlanFieldId = mpf.MasterPlanField.Id,
                                    MasterPlanFieldName = mpf.MasterPlanField.Name,
                                    Value = mpe
                                        .MasterPlanElement.Values.Where(v =>
                                            v.MasterPlanFieldId == mpf.MasterPlanField.Id
                                        )
                                        .Select(v => v.Value)
                                        .FirstOrDefault(),
                                })
                                .ToList(),
                        })
                        .ToList(),

                    // Meta data.
                    CreationDate = t.CreationDate,
                    CreatedBy = t.CreatedBy,
                    UpdateDate = t.UpdateDate,
                    UpdatedBy = t.UpdatedBy,

                    // Check-out system.
                    IsCheckedOut = t.IsCheckedOut,
                    CheckedOutBy = t.CheckedOutBy,
                    CheckedOutAt = t.CheckedOutAt,
                })
                .ToList();

            var result = new
            {
                totalCount,
                items = masterPlans,
                counts = new
                {
                    visibilityCount,
                    allowRemovingElementsCount,
                    unitGroupCount,
                    unitCount,
                    fieldCount,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetMasterPlan(int id)
        {
            var lang = await GetLangAsync();
            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.UnitGroup)
                .Include(m => m.MasterPlanToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .Include(m => m.MasterPlanToMasterPlanElements)
                .ThenInclude(mpe => mpe.MasterPlanElement)
                .ThenInclude(e => e.Values)
                .ThenInclude(v => v.MasterPlanField)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            var unknownGroup = await _t.GetAsync("UnitGroup/Unknown", lang);

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
                AllowRemovingElements = masterPlan.AllowRemovingElements,
                UnitGroupId = masterPlan.UnitGroupId,
                UnitGroupName = masterPlan.UnitGroup.Name ?? unknownGroup,
                Fields = masterPlan
                    .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                    .Select(mpf => new MasterPlanFieldDto
                    {
                        Id = mpf.MasterPlanField.Id,
                        Name = mpf.MasterPlanField.Name,
                        DataType = mpf.MasterPlanField.DataType,
                        Alignment = mpf.MasterPlanField.Alignment,
                        IsHidden = mpf.MasterPlanField.IsHidden,
                    })
                    .ToList(),
                Elements = masterPlan
                    .MasterPlanToMasterPlanElements.OrderBy(mpe => mpe.Order)
                    .Select(mpe => new MasterPlanElementDto
                    {
                        Id = mpe.MasterPlanElement.Id,
                        GroupId = mpe.MasterPlanElement.GroupId,
                        StruckElement = mpe.MasterPlanElement.StruckElement,
                        CurrentElement = mpe.MasterPlanElement.CurrentElement,
                        NextElement = mpe.MasterPlanElement.NextElement,
                        Values = masterPlan
                            .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                            .Select(mpf => new MasterPlanElementValueDto
                            {
                                MasterPlanFieldId = mpf.MasterPlanField.Id,
                                MasterPlanFieldName = mpf.MasterPlanField.Name,
                                Value = mpe
                                    .MasterPlanElement.Values.Where(v =>
                                        v.MasterPlanFieldId == mpf.MasterPlanField.Id
                                    )
                                    .Select(v => v.Value)
                                    .FirstOrDefault(),
                            })
                            .ToList(),
                    })
                    .ToList(),

                // Check-out system.
                IsCheckedOut = masterPlan.IsCheckedOut,
                CheckedOutBy = masterPlan.CheckedOutBy,
                CheckedOutAt = masterPlan.CheckedOutAt,
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
            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.UnitGroup)
                .Include(mp => mp.MasterPlanToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .Include(mp => mp.MasterPlanToMasterPlanElements)
                .ThenInclude(mpe => mpe.MasterPlanElement)
                .FirstOrDefaultAsync(mp => mp.Id == id);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            var isInUse = await _context.Units.AnyAsync(u => u.MasterPlanId == id);

            if (isInUse)
            {
                return BadRequest(new { message = await _t.GetAsync("MasterPlan/InUse", lang) });
            }

            var masterPlanFieldIds = masterPlan
                .MasterPlanToMasterPlanFields.Select(mpf => mpf.MasterPlanFieldId)
                .ToList();

            _context.MasterPlanToMasterPlanFields.RemoveRange(
                masterPlan.MasterPlanToMasterPlanFields
            );

            var masterPlanFieldsToCheck = await _context
                .MasterPlanFields.Include(mpf => mpf.MasterPlanToMasterPlanFields)
                .Where(mpf => masterPlanFieldIds.Contains(mpf.Id))
                .ToListAsync();

            var masterPlanFieldsToDelete = masterPlanFieldsToCheck
                .Where(mpf => mpf.MasterPlanToMasterPlanFields.Count == 1)
                .ToList();

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
                    ["UnitGroup"] =
                        $"{masterPlan.UnitGroup.Name} (ID: {masterPlan.UnitGroupId})" ?? "—",
                    ["MasterPlanFields"] = masterPlan.MasterPlanToMasterPlanFields.Any()
                        ? string.Join(
                            "<br>",
                            masterPlan
                                .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                                .Select(mpf =>
                                    $"{mpf.MasterPlanField.Name} (ID: {mpf.MasterPlanField.Id})"
                                )
                        )
                        : "—",
                    ["AllowRemovingElements"] = masterPlan.AllowRemovingElements
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                    ["IsHidden"] = masterPlan.IsHidden
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                }
            );

            _context.MasterPlanToMasterPlanFields.RemoveRange(
                masterPlan.MasterPlanToMasterPlanFields
            );
            _context.MasterPlanToMasterPlanElements.RemoveRange(
                masterPlan.MasterPlanToMasterPlanElements
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

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
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

            if (dto.MasterPlanFieldIds == null || dto.MasterPlanFieldIds.Length == 0)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlan/AtLeastOneFieldRequired", lang) }
                );
            }

            var (createdBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var masterPlan = new MasterPlan
            {
                Name = dto.Name,
                IsHidden = dto.IsHidden,
                AllowRemovingElements = dto.AllowRemovingElements,
                UnitGroup = unitGroup,
                MasterPlanToMasterPlanFields = dto
                    .MasterPlanFieldIds.Select(
                        (id, index) =>
                            new MasterPlanToMasterPlanField
                            {
                                MasterPlanFieldId = id,
                                Order = index,
                                MasterPlanField = _context.MasterPlanFields.First(m => m.Id == id),
                            }
                    )
                    .ToList(),

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
                AllowRemovingElements = masterPlan.AllowRemovingElements,
                UnitGroupId = masterPlan.UnitGroupId,
                Fields = masterPlan
                    .MasterPlanToMasterPlanFields.OrderBy(x => x.Order)
                    .Select(x => new MasterPlanFieldDto
                    {
                        Id = x.MasterPlanField.Id,
                        Name = x.MasterPlanField.Name,
                        DataType = x.MasterPlanField.DataType,
                        Alignment = x.MasterPlanField.Alignment,
                        IsHidden = x.MasterPlanField.IsHidden,
                    })
                    .ToList(),

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
                    ["UnitGroup"] =
                        $"{masterPlan.UnitGroup.Name} (ID: {masterPlan.UnitGroupId})" ?? "—",
                    ["MasterPlanFields"] = masterPlan.MasterPlanToMasterPlanFields.Any()
                        ? string.Join(
                            "<br>",
                            masterPlan
                                .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                                .Select(mpf =>
                                    $"{mpf.MasterPlanField.Name} (ID: {mpf.MasterPlanField.Id})"
                                )
                        )
                        : "—",
                    ["AllowRemovingElements"] = masterPlan.AllowRemovingElements
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
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
            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.UnitGroup)
                .Include(mp => mp.MasterPlanToMasterPlanFields)
                .ThenInclude(mpf => mpf.MasterPlanField)
                .Include(mp => mp.MasterPlanToMasterPlanElements)
                .ThenInclude(mpe => mpe.MasterPlanElement)
                .FirstOrDefaultAsync(mp => mp.Id == id);

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

            var unitGroup = await _context.UnitGroups.FindAsync(dto.UnitGroupId);

            if (unitGroup == null)
            {
                return NotFound(new { message = await _t.GetAsync("UnitGroup/NotFound", lang) });
            }

            var existingMasterPlan = await _context.MasterPlans.FirstOrDefaultAsync(t =>
                t.Name.ToLower() == dto.Name.ToLower() && t.Id != id
            );

            if (existingMasterPlan != null && existingMasterPlan.UnitGroupId == unitGroup.Id)
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

            if (dto.MasterPlanFieldIds == null || dto.MasterPlanFieldIds.Length == 0)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("MasterPlan/AtLeastOneFieldRequired", lang) }
                );
            }

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = masterPlan.Id,
                ["Name"] = masterPlan.Name,
                ["UnitGroup"] = $"{masterPlan.UnitGroup.Name} (ID: {masterPlan.UnitGroupId})",
                ["MasterPlanFields"] = masterPlan.MasterPlanToMasterPlanFields.Any()
                    ? string.Join(
                        "<br>",
                        masterPlan
                            .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                            .Select(mpf =>
                                $"{mpf.MasterPlanField.Name} (ID: {mpf.MasterPlanField.Id})"
                            )
                    )
                    : "—",
                ["AllowRemovingElements"] = masterPlan.AllowRemovingElements
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
                ["IsHidden"] = masterPlan.IsHidden ? new[] { "Common/Yes" } : new[] { "Common/No" },
            };

            masterPlan.Name = dto.Name;
            masterPlan.IsHidden = dto.IsHidden;
            masterPlan.AllowRemovingElements = dto.AllowRemovingElements;
            masterPlan.MasterPlanToMasterPlanFields = dto
                .MasterPlanFieldIds.Select(
                    (id, index) =>
                        new MasterPlanToMasterPlanField
                        {
                            MasterPlanFieldId = id,
                            Order = index,
                            MasterPlanField = _context.MasterPlanFields.First(m => m.Id == id),
                        }
                )
                .ToList();

            masterPlan.UnitGroup = unitGroup;
            masterPlan.UpdateDate = now;
            masterPlan.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            var result = new MasterPlanDto
            {
                Id = masterPlan.Id,
                Name = masterPlan.Name,
                IsHidden = masterPlan.IsHidden,
                AllowRemovingElements = masterPlan.AllowRemovingElements,
                UnitGroupId = masterPlan.UnitGroupId,
                Fields = masterPlan
                    .MasterPlanToMasterPlanFields.OrderBy(x => x.Order)
                    .Select(x => new MasterPlanFieldDto
                    {
                        Id = x.MasterPlanField.Id,
                        Name = x.MasterPlanField.Name,
                        DataType = x.MasterPlanField.DataType,
                        Alignment = x.MasterPlanField.Alignment,
                        IsHidden = x.MasterPlanField.IsHidden,
                    })
                    .ToList(),

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
                        ["UnitGroup"] =
                            $"{masterPlan.UnitGroup.Name} (ID: {masterPlan.UnitGroupId})" ?? "—",
                        ["MasterPlanFields"] = masterPlan.MasterPlanToMasterPlanFields.Any()
                            ? string.Join(
                                "<br>",
                                masterPlan
                                    .MasterPlanToMasterPlanFields.OrderBy(mpf => mpf.Order)
                                    .Select(mpf =>
                                        $"{mpf.MasterPlanField.Name} (ID: {mpf.MasterPlanField.Id})"
                                    )
                            )
                            : "—",
                        ["AllowRemovingElements"] = masterPlan.AllowRemovingElements
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                        ["IsHidden"] = masterPlan.IsHidden
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                    },
                }
            );

            return Ok(result);
        }

        [HttpPost("check/{id}")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> Check(
            int id,
            [FromQuery] bool force = false,
            [FromQuery] bool cancelled = false
        )
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (username, userId) = userInfo.Value;
            var masterPlan = await _context.MasterPlans.FirstOrDefaultAsync(mp => mp.Id == id);
            if (masterPlan == null)
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });

            // If already checked out.
            if (masterPlan.IsCheckedOut)
            {
                // Check if same user. If so - check in.
                if (masterPlan.CheckedOutBy == username)
                {
                    masterPlan.IsCheckedOut = false;
                    masterPlan.CheckedOutBy = null;
                    masterPlan.CheckedOutAt = null;
                    masterPlan.UpdateDate = DateTime.UtcNow;
                    masterPlan.UpdatedBy = username;
                    await _context.SaveChangesAsync();

                    // Notify all clients that plan was checked in.
                    if (MasterPlanHub.UserConnections.TryGetValue(username, out var connectionIdIn))
                    {
                        await _hub
                            .Clients.AllExcept(connectionIdIn)
                            .SendAsync(
                                "MasterPlanCheckedIn",
                                new
                                {
                                    masterPlanId = id,
                                    checkedInBy = username,
                                    message = "MasterPlan/Checked in by user",
                                }
                            );
                    }
                    else
                    {
                        await _hub.Clients.All.SendAsync(
                            "MasterPlanCheckedIn",
                            new
                            {
                                masterPlanId = id,
                                checkedInBy = username,
                                message = "MasterPlan/Checked in by user",
                            }
                        );
                    }

                    return Ok(
                        new
                        {
                            message = cancelled
                                ? "MasterPlan/No changes made"
                                : "MasterPlan/Checked in",
                            isCheckedOut = false,
                        }
                    );
                }

                // Another user has checked out.
                if (!force)
                {
                    var msg = string.Format(
                        await _t.GetAsync("MasterPlan/CheckedOutByAnotherUser", lang),
                        masterPlan.CheckedOutBy
                    );
                    return Conflict(new { message = msg });
                }

                // Force check out.
                masterPlan.CheckedOutBy = username;
                masterPlan.CheckedOutAt = DateTime.UtcNow;
                masterPlan.UpdateDate = DateTime.UtcNow;
                masterPlan.UpdatedBy = username;
                await _context.SaveChangesAsync();

                // Notify all clients that plan was forcefully taken over.
                if (MasterPlanHub.UserConnections.TryGetValue(username, out var connectionIdForce))
                {
                    await _hub
                        .Clients.AllExcept(connectionIdForce)
                        .SendAsync(
                            "MasterPlanForceTakenOver",
                            new
                            {
                                masterPlanId = id,
                                forcedBy = username,
                                message = "MasterPlan/Force taken over",
                            }
                        );
                }
                else
                {
                    await _hub.Clients.All.SendAsync(
                        "MasterPlanForceTakenOver",
                        new
                        {
                            masterPlanId = id,
                            forcedBy = username,
                            message = "MasterPlan/Force taken over",
                        }
                    );
                }

                return Ok(new { message = "MasterPlan/Force checked out", isCheckedOut = true });
            }

            // Is not checked out - new check out.
            masterPlan.IsCheckedOut = true;
            masterPlan.CheckedOutBy = username;
            masterPlan.CheckedOutAt = DateTime.UtcNow;
            masterPlan.UpdateDate = DateTime.UtcNow;
            masterPlan.UpdatedBy = username;

            await _context.SaveChangesAsync();

            // Notify all clients that plan was checked out normally.
            if (MasterPlanHub.UserConnections.TryGetValue(username, out var connectionIdOut))
            {
                await _hub
                    .Clients.AllExcept(connectionIdOut)
                    .SendAsync(
                        "MasterPlanCheckedOut",
                        new
                        {
                            masterPlanId = id,
                            checkedOutBy = username,
                            message = "MasterPlan/Checked out by user",
                        }
                    );
            }
            else
            {
                await _hub.Clients.All.SendAsync(
                    "MasterPlanCheckedOut",
                    new
                    {
                        masterPlanId = id,
                        checkedOutBy = username,
                        message = "MasterPlan/Checked out by user",
                    }
                );
            }

            return Ok(new { message = "MasterPlan/Checked out", isCheckedOut = true });
        }

        [HttpGet("check/status/{id}")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> CheckStatus(int id)
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (username, _) = userInfo.Value;

            var masterPlan = await _context
                .MasterPlans.AsNoTracking()
                .Select(mp => new
                {
                    mp.Id,
                    mp.IsCheckedOut,
                    mp.CheckedOutBy,
                    mp.CheckedOutAt,
                })
                .FirstOrDefaultAsync(mp => mp.Id == id);

            if (masterPlan == null)
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });

            return Ok(
                new
                {
                    masterPlan.Id,
                    masterPlan.IsCheckedOut,
                    masterPlan.CheckedOutBy,
                    masterPlan.CheckedOutAt,
                    IsCheckedOutByMe = masterPlan.CheckedOutBy == username,
                }
            );
        }
    }
}
