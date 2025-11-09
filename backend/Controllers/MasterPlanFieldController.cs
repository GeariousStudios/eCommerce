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
    [Authorize(Roles = "Admin")]
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
        public async Task<IActionResult> GetAll()
        {
            var fields = await _context
                .MasterPlanFields.OrderBy(f => f.Name)
                .Select(f => new MasterPlanFieldDto { Id = f.Id, Name = f.Name })
                .ToListAsync();

            return Ok(fields);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteMasterPlanField(int id)
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

            _context.MasterPlanFields.Remove(field);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("MasterPlanField/Deleted", lang) });
        }

        [HttpPost("create")]
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
                MasterPlanIds = field
                    .MasterPlanToMasterPlanFields.Select(m => m.MasterPlanId)
                    .ToList(),

                // Meta data.
                CreationDate = field.CreationDate,
                CreatedBy = field.CreatedBy,
                UpdateDate = field.UpdateDate,
                UpdatedBy = field.UpdatedBy,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
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

            field.Name = dto.Name;

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
                MasterPlanIds = field
                    .MasterPlanToMasterPlanFields.Select(m => m.MasterPlanId)
                    .ToList(),

                // Meta data.
                UpdateDate = field.UpdateDate,
                UpdatedBy = field.UpdatedBy,
            };

            return Ok(result);
        }
    }
}
