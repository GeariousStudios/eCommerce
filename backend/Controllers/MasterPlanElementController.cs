using backend.Data;
using backend.Dtos.MasterPlan;
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

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.MasterPlanElements.Add(newElement);
            await _context.SaveChangesAsync();

            var order = masterPlan.MasterPlanToMasterPlanElements.Any()
                ? masterPlan.MasterPlanToMasterPlanElements.Max(e => e.Order) + 1
                : 0;

            var newLink = new MasterPlanToMasterPlanElement
            {
                MasterPlanId = masterPlan.Id,
                MasterPlanElementId = newElement.Id,
                Order = order,
            };

            _context.MasterPlanToMasterPlanElements.Add(newLink);
            await _context.SaveChangesAsync();

            // Audit trail.
            await _audit.LogAsync(
                "Create",
                "MasterPlanElement",
                newElement.Id,
                createdBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = newElement.Id,
                    ["MasterPlanID"] = masterPlan.Id,
                    ["Order"] = order,
                }
            );

            return Ok(new { id = newElement.Id });
        }

        [HttpPut("update/{elementId}/values")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> UpdateElementValues(
            int elementId,
            [FromBody] UpdateMasterPlanElementDto dto
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

            var (updatedBy, userId) = userInfo.Value;
            var element = await _context
                .MasterPlanElements.Include(e => e.Values)
                .FirstOrDefaultAsync(e => e.Id == elementId);

            if (element == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanElement/NotFound", lang) }
                );
            }

            var now = DateTime.UtcNow;

            if (dto.Values == null || !dto.Values.Any())
            {
                element.GroupId = dto.GroupId;
                element.StruckElement = dto.StruckElement;
                element.CurrentElement = dto.CurrentElement;
                element.NextElement = dto.NextElement;
                element.UpdateDate = DateTime.UtcNow;
                element.UpdatedBy = updatedBy;

                await _context.SaveChangesAsync();

                return Ok(new { message = await _t.GetAsync("MasterPlanElement/Updated", lang) });
            }

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

            element.GroupId = dto.GroupId;
            element.StruckElement = dto.StruckElement;
            element.CurrentElement = dto.CurrentElement;
            element.NextElement = dto.NextElement;
            element.UpdateDate = now;
            element.UpdatedBy = updatedBy;

            await _context.SaveChangesAsync();

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "MasterPlanElement",
                element.Id,
                updatedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["ObjectID"] = element.Id,
                    ["UpdatedFields"] =
                        dto.Values != null
                            ? string.Join(", ", dto.Values.Select(v => v.MasterPlanFieldId))
                            : "",
                }
            );

            return Ok(new { message = await _t.GetAsync("MasterPlanElement/Updated", lang) });
        }

        [HttpPut("update/{elementId}")]
        [Authorize(Roles = "MasterPlanner")]
        public async Task<IActionResult> UpdateElementMeta(
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
                .MasterPlanElements.Include(e => e.MasterPlanToMasterPlanElements)
                .FirstOrDefaultAsync(e => e.Id == elementId);

            if (element == null)
                return NotFound(
                    new { message = await _t.GetAsync("MasterPlanElement/NotFound", lang) }
                );

            element.GroupId = dto.GroupId;
            element.StruckElement = dto.StruckElement;
            element.CurrentElement = dto.CurrentElement;
            element.NextElement = dto.NextElement;
            element.UpdateDate = DateTime.UtcNow;
            element.UpdatedBy = updatedBy;

            if (dto.Order.HasValue)
            {
                var link = await _context.MasterPlanToMasterPlanElements.FirstOrDefaultAsync(l =>
                    l.MasterPlanElementId == element.Id
                );

                if (link != null)
                {
                    link.Order = dto.Order.Value;
                }
            }

            await _context.SaveChangesAsync();

            // Audit trail.
            await _audit.LogAsync(
                "Update",
                "MasterPlanElement",
                element.Id,
                updatedBy,
                userId,
                new Dictionary<string, object?>
                {
                    ["GroupId"] = dto.GroupId,
                    ["StruckElement"] = dto.StruckElement,
                    ["CurrentElement"] = dto.CurrentElement,
                    ["NextElement"] = dto.NextElement,
                    ["Order"] = dto.Order,
                }
            );

            return Ok(new { message = await _t.GetAsync("MasterPlanElement/Updated", lang) });
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
                    ["MasterPlanID"] = masterPlanId,
                    ["ValueCount"] = element.Values.Count,
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
    }
}
