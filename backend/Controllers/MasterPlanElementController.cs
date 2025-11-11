using backend.Data;
using backend.Dtos.MasterPlan;
using backend.Dtos.MasterPlan.Element;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("master-plan-elements")]
    public class MasterPlanElementController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public MasterPlanElementController(
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

        [HttpPost("create/{masterPlanId}")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> CreateElement(
            int masterPlanId,
            [FromBody] CreateMasterPlanElementDto dto
        )
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
            {
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );
            }

            var (createdBy, userId) = userInfo.Value;
            var masterPlan = await _context
                .MasterPlans.Include(mp => mp.MasterPlanToMasterPlanElements)
                .FirstOrDefaultAsync(mp => mp.Id == masterPlanId);

            if (masterPlan == null)
            {
                return NotFound(new { message = await _t.GetAsync("MasterPlan/NotFound", lang) });
            }

            var now = DateTime.UtcNow;

            var newElement = new MasterPlanElement
            {
                GroupId = dto.GroupId,
                StruckElement = dto.StruckElement,
                CurrentElement = dto.CurrentElement,
                NextElement = dto.NextElement,
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.MasterPlanElements.Add(newElement);
            await _context.SaveChangesAsync();

            var insertOrder = dto.Order.HasValue
                ? dto.Order.Value
                : (
                    masterPlan.MasterPlanToMasterPlanElements.Any()
                        ? masterPlan.MasterPlanToMasterPlanElements.Max(e => e.Order) + 1
                        : 0
                );

            var linksToShift = await _context
                .MasterPlanToMasterPlanElements.Where(l =>
                    l.MasterPlanId == masterPlan.Id && l.Order >= insertOrder
                )
                .OrderByDescending(l => l.Order)
                .ToListAsync();

            foreach (var link in linksToShift)
            {
                link.Order = link.Order + 1;
            }

            var newLink = new MasterPlanToMasterPlanElement
            {
                MasterPlanId = masterPlan.Id,
                MasterPlanElementId = newElement.Id,
                Order = insertOrder,
            };
            _context.MasterPlanToMasterPlanElements.Add(newLink);

            if (dto.Values != null)
            {
                foreach (var v in dto.Values)
                {
                    _context.MasterPlanElementValues.Add(
                        new MasterPlanElementValue
                        {
                            MasterPlanElementId = newElement.Id,
                            MasterPlanFieldId = v.MasterPlanFieldId,
                            Value = v.Value,
                            CreationDate = now,
                            CreatedBy = createdBy,
                            UpdateDate = now,
                            UpdatedBy = createdBy,
                        }
                    );
                }
            }

            await _context.SaveChangesAsync();

            await _context.Entry(newElement).Collection(e => e.Values).LoadAsync();
            await _context
                .Entry(newElement)
                .Collection(e => e.MasterPlanToMasterPlanElements)
                .LoadAsync();

            // Audit-trail.
            await _audit.LogAsync(
                "Create",
                "MasterPlanElement",
                newElement.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = newElement.Id,
                    ["BelongsToMasterPlan"] = $"{masterPlan?.Name} (ID: {masterPlanId})",
                    ["GroupID"] = newElement.GroupId,
                    ["Order"] = newLink.Order,
                    ["IsStruck"] = newElement.StruckElement
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                    ["Data"] = newElement
                        .Values.Select(v => new Dictionary<string, object?>
                        {
                            ["MasterPlanField"] =
                                $"{v.MasterPlanField?.Name} (ID: {v.MasterPlanFieldId})",
                            ["Value"] = v.Value ?? "—",
                        })
                        .ToList(),
                }
            );

            return Ok(new { id = newElement.Id });
        }

        [HttpDelete("delete/{elementId}")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> DeleteElement(int elementId)
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
            var element = await _context
                .MasterPlanElements.Include(e => e.Values)
                .ThenInclude(v => v.MasterPlanField)
                .Include(e => e.MasterPlanToMasterPlanElements)
                .ThenInclude(link => link.MasterPlan)
                .FirstOrDefaultAsync(e => e.Id == elementId);

            if (element == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanElement/NotFound", lang) }
                );
            }

            var masterPlan = element.MasterPlanToMasterPlanElements.FirstOrDefault()?.MasterPlan;
            var masterPlanId = masterPlan?.Id ?? 0;

            if (masterPlan != null && !masterPlan.AllowRemovingElements)
            {
                return BadRequest(
                    new
                    {
                        message = await _t.GetAsync(
                            "MasterPlanElement/AllowRemovingElementsFirst",
                            lang
                        ),
                    }
                );
            }

            // Audit trail.
            await _audit.LogAsync(
                "Delete",
                "MasterPlanElement",
                element.Id,
                deletedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = element.Id,
                    ["BelongsToMasterPlan"] = $"{masterPlan?.Name} (ID: {masterPlanId})",
                    ["GroupID"] = element.GroupId,
                    ["Order"] = element
                        .MasterPlanToMasterPlanElements.Where(link =>
                            link.MasterPlanId == masterPlanId
                        )
                        .Select(link => link.Order)
                        .FirstOrDefault(),
                    ["IsStruck"] = element.StruckElement
                        ? new[] { "Common/Yes" }
                        : new[] { "Common/No" },
                    ["Data"] = element
                        .Values.Select(v => new Dictionary<string, object?>
                        {
                            ["MasterPlanField"] =
                                $"{v.MasterPlanField?.Name} (ID: {v.MasterPlanFieldId})",
                            ["Value"] = v.Value != null ? v.Value : "—",
                        })
                        .ToList(),
                }
            );

            _context.MasterPlanElementValues.RemoveRange(element.Values);
            _context.MasterPlanToMasterPlanElements.RemoveRange(
                element.MasterPlanToMasterPlanElements
            );
            _context.MasterPlanElements.Remove(element);

            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("MasterPlanElement/Deleted", lang) });
        }

        [HttpPut("update/{elementId}")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> UpdateElement(
            int elementId,
            [FromBody] UpdateMasterPlanElementDto dto
        )
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();
            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (updatedBy, userId) = userInfo.Value;
            var element = await _context
                .MasterPlanElements.Include(e => e.Values)
                .ThenInclude(v => v.MasterPlanField)
                .Include(e => e.MasterPlanToMasterPlanElements)
                .ThenInclude(link => link.MasterPlan)
                .FirstOrDefaultAsync(e => e.Id == elementId);

            if (element == null)
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanElement/NotFound", lang) }
                );

            var masterPlan = element.MasterPlanToMasterPlanElements.FirstOrDefault()?.MasterPlan;
            var now = DateTime.UtcNow;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = element.Id,
                ["BelongsToMasterPlan"] = $"{masterPlan?.Name} (ID: {masterPlan?.Id})",
                ["GroupID"] = element.GroupId,
                ["Order"] = element.MasterPlanToMasterPlanElements.FirstOrDefault()?.Order,
                ["IsStruck"] = element.StruckElement
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
                ["Data"] = element
                    .Values.Select(v => new Dictionary<string, object?>
                    {
                        ["MasterPlanField"] =
                            $"{v.MasterPlanField?.Name} (ID: {v.MasterPlanFieldId})",
                        ["Value"] = v.Value ?? "—",
                    })
                    .ToList(),
            };

            var groupBefore = element.GroupId;
            var struckBefore = element.StruckElement;
            var currentBefore = element.CurrentElement;
            var nextBefore = element.NextElement;

            var valueChanged =
                dto.Values != null
                && dto.Values.Any(v =>
                {
                    var oldVal = element
                        .Values.FirstOrDefault(ev => ev.MasterPlanFieldId == v.MasterPlanFieldId)
                        ?.Value;
                    return oldVal != v.Value;
                });

            if (dto.Values != null)
            {
                foreach (var valueDto in dto.Values)
                {
                    var existingValue = element.Values.FirstOrDefault(v =>
                        v.MasterPlanFieldId == valueDto.MasterPlanFieldId
                    );
                    if (existingValue == null)
                    {
                        _context.MasterPlanElementValues.Add(
                            new MasterPlanElementValue
                            {
                                MasterPlanElementId = element.Id,
                                MasterPlanFieldId = valueDto.MasterPlanFieldId,
                                Value = valueDto.Value,
                                CreationDate = now,
                                CreatedBy = updatedBy,
                                UpdateDate = now,
                                UpdatedBy = updatedBy,
                            }
                        );
                    }
                    else
                    {
                        existingValue.Value = valueDto.Value;
                        existingValue.UpdateDate = now;
                        existingValue.UpdatedBy = updatedBy;
                    }
                }
            }

            element.GroupId = dto.GroupId ?? element.GroupId;
            element.StruckElement = dto.StruckElement;
            element.CurrentElement = dto.CurrentElement;
            element.NextElement = dto.NextElement;
            element.UpdateDate = now;
            element.UpdatedBy = updatedBy;

            if (dto.Order.HasValue)
            {
                var link = element.MasterPlanToMasterPlanElements.FirstOrDefault();
                if (link != null)
                    link.Order = dto.Order.Value;
            }

            if (dto.GroupList != null)
            {
                foreach (var item in dto.GroupList.Elements)
                {
                    var link = await _context
                        .MasterPlanToMasterPlanElements.Include(x => x.MasterPlanElement)
                        .FirstOrDefaultAsync(x =>
                            x.MasterPlanElementId == item.ElementId
                            && x.MasterPlanId == masterPlan!.Id
                        );
                    if (link == null)
                        continue;

                    link.Order = item.Order;
                    link.MasterPlanElement.GroupId = item.GroupId;
                    link.MasterPlanElement.UpdateDate = now;
                    link.MasterPlanElement.UpdatedBy = updatedBy;
                }
            }

            await _context.SaveChangesAsync();

            var newValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = element.Id,
                ["BelongsToMasterPlan"] = $"{masterPlan?.Name} (ID: {masterPlan?.Id})",
                ["GroupID"] = element.GroupId,
                ["Order"] = element.MasterPlanToMasterPlanElements.FirstOrDefault()?.Order,
                ["IsStruck"] = element.StruckElement
                    ? new[] { "Common/Yes" }
                    : new[] { "Common/No" },
                ["Data"] = element
                    .Values.Select(v => new Dictionary<string, object?>
                    {
                        ["MasterPlanField"] =
                            $"{v.MasterPlanField?.Name} (ID: {v.MasterPlanFieldId})",
                        ["Value"] = v.Value ?? "—",
                    })
                    .ToList(),
            };

            var oldOrder = oldValues["Order"];
            var newOrder = newValues["Order"];
            var orderChanged = oldOrder == null || !Equals(oldOrder, newOrder);

            var groupChanged = groupBefore != element.GroupId;
            var struckChanged = struckBefore != element.StruckElement;
            var currentChanged = currentBefore != element.CurrentElement;
            var nextChanged = nextBefore != element.NextElement;

            var otherChanges =
                groupChanged || struckChanged || currentChanged || nextChanged || valueChanged;

            if (orderChanged)
            {
                await _audit.LogAsync(
                    "Move",
                    "MasterPlanElement",
                    element.Id,
                    updatedBy,
                    userId,
                    new { OldValues = oldValues, NewValues = newValues }
                );
            }

            if (otherChanges)
            {
                await _audit.LogAsync(
                    "Update",
                    "MasterPlanElement",
                    element.Id,
                    updatedBy,
                    userId,
                    new { OldValues = oldValues, NewValues = newValues }
                );
            }

            return Ok(new { message = await _t.GetAsync("MasterPlanElement/Updated", lang) });
        }
    }
}
