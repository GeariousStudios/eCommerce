using backend.Data;
using backend.Dtos.TrendingPanel;
using backend.Models;
using backend.Models.ManyToMany;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("trending-panel")]
    public class TrendingPanelController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserService _userService;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public TrendingPanelController(
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
        public async Task<IActionResult> GetAll([FromQuery] bool latestFirst = false)
        {
            var userInfo = await _userService.GetUserInfoAsync();
            int? userId = userInfo?.UserId;

            var query = _context
                .TrendingPanels.Include(tp => tp.UnitColumn)
                .Include(tp => tp.TrendingPanelToUnits)
                .ThenInclude(tpu => tpu.Unit)
                .Where(tp => tp.UserId == null || tp.UserId == userId);

            if (latestFirst)
            {
                query = query.OrderBy(tp => tp.Order).ThenByDescending(tp => tp.CreationDate);
            }
            else
            {
                query = query.OrderBy(tp => tp.Order).ThenBy(tp => tp.Id);
            }

            var panels = await query.ToListAsync();

            var result = panels.Select(tp => new TrendingPanelDto
            {
                Id = tp.Id,
                Name = tp.Name,
                Type = tp.Type,
                Period = tp.Period,
                ViewMode = tp.ViewMode,
                UnitColumnId = tp.UnitColumnId,
                UnitColumnName = tp.UnitColumn?.Name,
                UnitIds = tp.TrendingPanelToUnits.Any()
                    ? tp.TrendingPanelToUnits.Select(tpu => tpu.UnitId).ToList()
                    : null,
                CustomStartDate = tp.CustomStartDate,
                CustomEndDate = tp.CustomEndDate,
                ColSpan = tp.ColSpan,
                ShowInfo = tp.ShowInfo,
                Order = tp.Order,

                // Meta data.
                CreationDate = tp.CreationDate,
                CreatedBy = tp.CreatedBy,
                UpdateDate = tp.UpdateDate,
                UpdatedBy = tp.UpdatedBy,
            });

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetTrendingPanel(int id)
        {
            var lang = await GetLangAsync();
            var panel = await _context
                .TrendingPanels.Include(tp => tp.UnitColumn)
                .FirstOrDefaultAsync(tp => tp.Id == id);

            if (panel == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("TrendingPanel/NotFound", lang) }
                );
            }

            var result = new TrendingPanelDto
            {
                Id = panel.Id,
                Name = panel.Name,
                Type = panel.Type,
                Period = panel.Period,
                ViewMode = panel.ViewMode,
                UnitColumnId = panel.UnitColumnId,
                UnitColumnName = panel.UnitColumn?.Name,
                UnitIds = panel.TrendingPanelToUnits.Any()
                    ? panel.TrendingPanelToUnits.Select(tpu => tpu.UnitId).ToList()
                    : null,
                CustomStartDate = panel.CustomStartDate,
                CustomEndDate = panel.CustomEndDate,
                ColSpan = panel.ColSpan,
                ShowInfo = panel.ShowInfo,
            };

            return Ok(result);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateTrendingPanel(CreateTrendingPanelDto dto)
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

            var panel = new TrendingPanel
            {
                Name = dto.Name,
                Type = dto.Type ?? TrendingTypes.Total,
                Period = dto.Period ?? TrendingPeriods.AllTime,
                ViewMode = dto.ViewMode ?? TrendingViewModes.Value,
                UnitColumnId = dto.UnitColumnId,
                CustomStartDate = dto.CustomStartDate,
                CustomEndDate = dto.CustomEndDate,
                ColSpan = dto.ColSpan,
                ShowInfo = dto.ShowInfo,
                UserId = dto.IsGlobal ? null : userId,
                TrendingPanelToUnits = dto
                    .UnitIds.Distinct()
                    .Select(unitId => new TrendingPanelToUnit { UnitId = unitId })
                    .ToList(),
                Order = await _context.TrendingPanels.CountAsync(tp => tp.UserId == userId),

                // Meta data.
                CreationDate = now,
                CreatedBy = createdBy,
                UpdateDate = now,
                UpdatedBy = createdBy,
            };

            _context.TrendingPanels.Add(panel);
            await _context.SaveChangesAsync();

            var result = new TrendingPanelDto
            {
                Id = panel.Id,
                Name = panel.Name,
                Type = panel.Type,
                Period = panel.Period,
                ViewMode = panel.ViewMode,
                UnitColumnId = panel.UnitColumnId,
                UnitColumnName = panel.UnitColumn?.Name,
                UnitIds = panel.TrendingPanelToUnits.Any()
                    ? panel.TrendingPanelToUnits.Select(tpu => tpu.UnitId).ToList()
                    : null,
                CustomStartDate = panel.CustomStartDate,
                CustomEndDate = panel.CustomEndDate,
                ColSpan = panel.ColSpan,
                ShowInfo = panel.ShowInfo,

                // Meta data.
                CreationDate = panel.CreationDate,
                CreatedBy = panel.CreatedBy,
                UpdateDate = panel.UpdateDate,
                UpdatedBy = panel.UpdatedBy,
            };

            if (!dto.IsGlobal)
            {
                // Audit trail.
                await _audit.LogAsync(
                    "Create",
                    "TrendingPanel",
                    panel.Id,
                    createdBy,
                    userId,
                    new Dictionary<string, object?>
                    {
                        ["ObjectID"] = panel.Id,
                        ["Name"] = panel.Name,
                        ["ViewMode"] = panel.ViewMode,
                        ["PanelSize"] = panel.ColSpan,
                        ["UnitsToTrend"] = panel
                            .TrendingPanelToUnits.Join(
                                _context.Units,
                                tpu => tpu.UnitId,
                                u => u.Id,
                                (tpu, u) => $"{u.Name} (ID: {u.Id})"
                            )
                            .ToList()
                            .DefaultIfEmpty("—")
                            .ToList(),
                        ["DataToTrend"] =
                            panel.UnitColumnId == null
                                ? new[] { "Common/All" }
                                : _context
                                    .UnitColumns.Where(uc => uc.Id == panel.UnitColumnId)
                                    .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                                    .FirstOrDefault(),
                        ["TrendingType"] = panel.Type,
                        ["TrendingPeriod"] = panel.Period,
                        ["CustomStartDate"] =
                            panel.CustomStartDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                        ["CustomEndDate"] =
                            panel.CustomEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                        ["ShowInfo"] = panel.ShowInfo
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                        ["Order"] = $"{panel.Order + 1}: {panel.Name} (ID: {panel.Id})",
                    }
                );
            }

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateTrendingPanel(int id, UpdateTrendingPanelDto dto)
        {
            var lang = await GetLangAsync();
            var panel = await _context
                .TrendingPanels.Include(tp => tp.TrendingPanelToUnits)
                .FirstOrDefaultAsync(tp => tp.Id == id);

            if (panel == null)
                return NotFound(
                    new { message = await _t.GetAsync("TrendingPanel/NotFound", lang) }
                );

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
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;
            var isGlobal = panel.UserId == null;

            var oldValues = new Dictionary<string, object?>
            {
                ["ObjectID"] = panel.Id,
                ["Name"] = panel.Name,
                ["ViewMode"] = panel.ViewMode,
                ["PanelSize"] = panel.ColSpan,
                ["UnitsToTrend"] = panel
                    .TrendingPanelToUnits.Join(
                        _context.Units,
                        tpu => tpu.UnitId,
                        u => u.Id,
                        (tpu, u) => $"{u.Name} (ID: {u.Id})"
                    )
                    .ToList()
                    .DefaultIfEmpty("—")
                    .ToList(),
                ["DataToTrend"] =
                    panel.UnitColumnId == null
                        ? new[] { "Common/All" }
                        : _context
                            .UnitColumns.Where(uc => uc.Id == panel.UnitColumnId)
                            .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                            .FirstOrDefault(),
                ["TrendingType"] = panel.Type,
                ["TrendingPeriod"] = panel.Period,
                ["CustomStartDate"] = panel.CustomStartDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                ["CustomEndDate"] = panel.CustomEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                ["ShowInfo"] = panel.ShowInfo ? new[] { "Common/Yes" } : new[] { "Common/No" },
                ["Order"] = $"{panel.Order + 1}: {panel.Name} (ID: {panel.Id})",
            };

            panel.Name = dto.Name;
            panel.Type = dto.Type ?? panel.Type;
            panel.Period = dto.Period ?? panel.Period;
            panel.ViewMode = dto.ViewMode ?? panel.ViewMode;
            panel.UnitColumnId = dto.UnitColumnId;
            panel.CustomStartDate = dto.CustomStartDate;
            panel.CustomEndDate = dto.CustomEndDate;
            panel.ColSpan = dto.ColSpan;
            panel.ShowInfo = dto.ShowInfo;

            // Meta data.
            panel.UpdateDate = now;
            panel.UpdatedBy = updatedBy;

            var oldLinks = await _context
                .TrendingPanelToUnits.Where(x => x.TrendingPanelId == panel.Id)
                .ToListAsync();

            _context.TrendingPanelToUnits.RemoveRange(oldLinks);

            var newLinks = dto
                .UnitIds.Distinct()
                .Select(unitId => new TrendingPanelToUnit
                {
                    TrendingPanelId = panel.Id,
                    UnitId = unitId,
                });

            _context.TrendingPanelToUnits.AddRange(newLinks);

            await _context.SaveChangesAsync();

            var result = new TrendingPanelDto
            {
                Id = panel.Id,
                Name = panel.Name,
                Type = panel.Type,
                Period = panel.Period,
                ViewMode = panel.ViewMode,
                UnitColumnId = panel.UnitColumnId,
                UnitColumnName = panel.UnitColumn?.Name,
                UnitIds = newLinks.Any() ? newLinks.Select(x => x.UnitId).ToList() : null,
                CustomStartDate = panel.CustomStartDate,
                CustomEndDate = panel.CustomEndDate,
                ColSpan = panel.ColSpan,
                ShowInfo = panel.ShowInfo,

                // Meta data.
                CreationDate = panel.CreationDate,
                CreatedBy = panel.CreatedBy,
                UpdateDate = panel.UpdateDate,
                UpdatedBy = panel.UpdatedBy,
            };

            if (!isGlobal)
            {
                // Audit trail.
                await _audit.LogAsync(
                    "Update",
                    "TrendingPanel",
                    panel.Id,
                    updatedBy,
                    userId,
                    new
                    {
                        OldValues = oldValues,
                        NewValues = new Dictionary<string, object?>
                        {
                            ["ObjectID"] = panel.Id,
                            ["Name"] = panel.Name,
                            ["ViewMode"] = panel.ViewMode,
                            ["PanelSize"] = panel.ColSpan,
                            ["UnitsToTrend"] = panel
                                .TrendingPanelToUnits.Join(
                                    _context.Units,
                                    tpu => tpu.UnitId,
                                    u => u.Id,
                                    (tpu, u) => $"{u.Name} (ID: {u.Id})"
                                )
                                .ToList()
                                .DefaultIfEmpty("—")
                                .ToList(),
                            ["DataToTrend"] =
                                panel.UnitColumnId == null
                                    ? new[] { "Common/All" }
                                    : _context
                                        .UnitColumns.Where(uc => uc.Id == panel.UnitColumnId)
                                        .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                                        .FirstOrDefault(),
                            ["TrendingType"] = panel.Type,
                            ["TrendingPeriod"] = panel.Period,
                            ["CustomStartDate"] =
                                panel.CustomStartDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                            ["CustomEndDate"] =
                                panel.CustomEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                            ["ShowInfo"] = panel.ShowInfo
                                ? new[] { "Common/Yes" }
                                : new[] { "Common/No" },
                            ["Order"] = $"{panel.Order + 1}: {panel.Name} (ID: {panel.Id})",
                        },
                    }
                );
            }

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteTrendingPanel(int id)
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

            var panel = await _context
                .TrendingPanels.Include(tp => tp.TrendingPanelToUnits)
                .ThenInclude(tpu => tpu.Unit)
                .FirstOrDefaultAsync(tp => tp.Id == id);

            if (panel == null)
            {
                return NotFound(
                    new { message = await _t.GetAsync("TrendingPanel/NotFound", lang) }
                );
            }

            var isGlobal = panel.UserId == null;

            _context.TrendingPanels.Remove(panel);
            await _context.SaveChangesAsync();

            if (!isGlobal)
            {
                // Audit trail.
                await _audit.LogAsync(
                    "Delete",
                    "TrendingPanel",
                    panel.Id,
                    deletedBy,
                    userId,
                    new Dictionary<string, object?>
                    {
                        ["ObjectID"] = panel.Id,
                        ["Name"] = panel.Name,
                        ["ViewMode"] = panel.ViewMode,
                        ["PanelSize"] = panel.ColSpan,
                        ["UnitsToTrend"] = panel
                            .TrendingPanelToUnits.Join(
                                _context.Units,
                                tpu => tpu.UnitId,
                                u => u.Id,
                                (tpu, u) => $"{u.Name} (ID: {u.Id})"
                            )
                            .ToList()
                            .DefaultIfEmpty("—")
                            .ToList(),
                        ["DataToTrend"] =
                            panel.UnitColumnId == null
                                ? new[] { "Common/All" }
                                : _context
                                    .UnitColumns.Where(uc => uc.Id == panel.UnitColumnId)
                                    .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                                    .FirstOrDefault(),
                        ["TrendingType"] = panel.Type,
                        ["TrendingPeriod"] = panel.Period,
                        ["CustomStartDate"] =
                            panel.CustomStartDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                        ["CustomEndDate"] =
                            panel.CustomEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                        ["ShowInfo"] = panel.ShowInfo
                            ? new[] { "Common/Yes" }
                            : new[] { "Common/No" },
                        ["Order"] = $"{panel.Order + 1}: {panel.Name} (ID: {panel.Id})",
                    }
                );
            }

            return Ok(new { message = await _t.GetAsync("TrendingPanel/Deleted", lang) });
        }

        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderTrendingPanels(
            [FromBody] List<TrendingPanelDto> panels
        )
        {
            var lang = await GetLangAsync();
            var userInfo = await _userService.GetUserInfoAsync();

            if (userInfo == null)
                return Unauthorized(
                    new { message = await _t.GetAsync("Common/Unauthorized", lang) }
                );

            var (updatedBy, userId) = userInfo.Value;
            var now = DateTime.UtcNow;

            var list = await _context
                .TrendingPanels.Include(tp => tp.TrendingPanelToUnits)
                .ThenInclude(tpu => tpu.Unit)
                .Where(tp => tp.UserId == userId || tp.UserId == null)
                .ToListAsync();

            var dict = list.ToDictionary(tp => tp.Id);

            var oldOrder = list.OrderBy(tp => tp.Order)
                .Select(tp => $"{tp.Order + 1}: {tp.Name} (ID: {tp.Id})")
                .ToList();

            var oldValuesPerPanel = new Dictionary<int, Dictionary<string, object?>>();
            foreach (var p in list)
            {
                var unitsOld = p
                    .TrendingPanelToUnits.OrderBy(x => x.UnitId)
                    .Select(x =>
                        x.Unit != null ? $"{x.Unit.Name} (ID: {x.UnitId})" : $"(ID: {x.UnitId})"
                    )
                    .ToList()
                    .DefaultIfEmpty("—")
                    .ToList();

                var dataToTrendOld =
                    p.UnitColumnId == null
                        ? new List<string> { "Common/All" }
                        : _context
                            .UnitColumns.Where(uc => uc.Id == p.UnitColumnId)
                            .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                            .ToList();

                oldValuesPerPanel[p.Id] = new Dictionary<string, object?>
                {
                    ["ObjectID"] = p.Id,
                    ["Name"] = p.Name,
                    ["ViewMode"] = p.ViewMode,
                    ["PanelSize"] = p.ColSpan,
                    ["UnitsToTrend"] = unitsOld,
                    ["DataToTrend"] = dataToTrendOld,
                    ["TrendingType"] = p.Type,
                    ["TrendingPeriod"] = p.Period,
                    ["CustomStartDate"] = p.CustomStartDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                    ["CustomEndDate"] = p.CustomEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                    ["ShowInfo"] = p.ShowInfo ? new[] { "Common/Yes" } : new[] { "Common/No" },
                    ["Order"] = oldOrder,
                };
            }

            foreach (var dto in panels)
            {
                if (dict.TryGetValue(dto.Id, out var panel))
                {
                    panel.Order = dto.Order;
                    panel.UpdateDate = now;
                    panel.UpdatedBy = updatedBy;
                }
            }

            await _context.SaveChangesAsync();

            var newOrder = list.OrderBy(tp => tp.Order)
                .Select(tp => $"{tp.Order + 1}: {tp.Name} (ID: {tp.Id})")
                .ToList();

            // Audit trail.
            foreach (var panel in list.Where(tp => tp.UserId == userId))
            {
                var unitsNew = panel
                    .TrendingPanelToUnits.OrderBy(x => x.UnitId)
                    .Select(x =>
                        x.Unit != null ? $"{x.Unit.Name} (ID: {x.UnitId})" : $"(ID: {x.UnitId})"
                    )
                    .ToList()
                    .DefaultIfEmpty("—")
                    .ToList();

                var dataToTrendNew =
                    panel.UnitColumnId == null
                        ? new List<string> { "Common/All" }
                        : _context
                            .UnitColumns.Where(uc => uc.Id == panel.UnitColumnId)
                            .Select(uc => $"{uc.Name} (ID: {uc.Id})")
                            .ToList();

                var newValues = new Dictionary<string, object?>
                {
                    ["ObjectID"] = panel.Id,
                    ["Name"] = panel.Name,
                    ["ViewMode"] = panel.ViewMode,
                    ["PanelSize"] = panel.ColSpan,
                    ["UnitsToTrend"] = unitsNew,
                    ["DataToTrend"] = dataToTrendNew,
                    ["TrendingType"] = panel.Type,
                    ["TrendingPeriod"] = panel.Period,
                    ["CustomStartDate"] =
                        panel.CustomStartDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                    ["CustomEndDate"] = panel.CustomEndDate?.ToString("yyyy-MM-dd HH:mm") ?? "—",
                    ["ShowInfo"] = panel.ShowInfo ? new[] { "Common/Yes" } : new[] { "Common/No" },
                    ["Order"] = newOrder,
                };

                await _audit.LogAsync(
                    "Update",
                    "TrendingPanel",
                    panel.Id,
                    updatedBy,
                    userId,
                    new { OldValues = oldValuesPerPanel[panel.Id], NewValues = newValues }
                );
            }

            return Ok();
        }
    }
}
