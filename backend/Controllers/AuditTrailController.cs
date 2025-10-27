using System.Text.Json;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("audit-trail")]
    [Authorize(Roles = "Admin,Developer,Reporter")]
    public class AuditTrailController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _t;

        public AuditTrailController(AppDbContext context, ITranslationService t)
        {
            _context = context;
            _t = t;
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

        [HttpGet("fetch")]
        public async Task<IActionResult> GetAuditTrail(
            [FromQuery] List<string>? entity = null,
            [FromQuery] int? entityId = null,
            [FromQuery] string? user = null,
            [FromQuery] int? userId = null,
            [FromQuery] List<string>? action = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] string? sortBy = "timestamp",
            [FromQuery] string? sortOrder = "desc"
        )
        {
            var query = _context.AuditTrails.AsQueryable();

            if (entity != null && entity.Count > 0)
                query = query.Where(a => entity.Contains(a.EntityName));

            if (entityId.HasValue)
                query = query.Where(a => a.EntityId == entityId);

            if (Request.Query.ContainsKey("user"))
            {
                var usersFromQuery = Request.Query["user"].ToList();
                if (usersFromQuery.Count > 0)
                {
                    var matchedUsers = await _context
                        .Users.Where(u =>
                            usersFromQuery.Contains(u.Username)
                            || usersFromQuery.Contains(u.FirstName + " " + u.LastName)
                        )
                        .Select(u => new
                        {
                            u.Id,
                            u.Username,
                            FullName = u.FirstName + " " + u.LastName,
                        })
                        .ToListAsync();

                    var matchedUserIds = matchedUsers.Select(u => u.Id).ToList();
                    var matchedUsernames = matchedUsers.Select(u => u.Username).ToList();
                    var matchedFullNames = matchedUsers.Select(u => u.FullName).ToList();

                    query = query.Where(a =>
                        matchedUserIds.Contains(a.UserId)
                        || matchedUsernames.Contains(a.Username)
                        || matchedFullNames.Contains(a.User)
                    );
                }
            }

            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId);

            if (action != null && action.Count > 0)
                query = query.Where(a => action.Contains(a.Action));

            if (from.HasValue)
                query = query.Where(a => a.Timestamp >= from.Value);

            if (to.HasValue)
                query = query.Where(a => a.Timestamp <= to.Value);

            var role =
                User.IsInRole("Admin") ? "Admin"
                : User.IsInRole("Developer") ? "Developer"
                : User.IsInRole("Reporter") ? "Reporter"
                : null;

            var lang = await GetLangAsync();

            query = sortBy?.ToLower() switch
            {
                "action" => sortOrder == "asc"
                    ? query.OrderBy(a => a.Action)
                    : query.OrderByDescending(a => a.Action),
                "entityname" => sortOrder == "asc"
                    ? query.OrderBy(a => a.EntityName)
                    : query.OrderByDescending(a => a.EntityName),
                "entityid" => sortOrder == "asc"
                    ? query.OrderBy(a => a.EntityId)
                    : query.OrderByDescending(a => a.EntityId),
                "user" => sortOrder == "asc"
                    ? query.OrderBy(a => a.User)
                    : query.OrderByDescending(a => a.User),
                "userid" => sortOrder == "asc"
                    ? query.OrderBy(a => a.UserId)
                    : query.OrderByDescending(a => a.UserId),
                _ => sortOrder == "asc"
                    ? query.OrderBy(a => a.Timestamp)
                    : query.OrderByDescending(a => a.Timestamp),
            };

            if (role != null && AuditTrailConfig.Rules.TryGetValue(role, out var rules))
            {
                if (!(rules.Count == 1 && rules[0].EntityName == null && rules[0].Action == null))
                {
                    var list = await query.Take(500).ToListAsync();

                    list = list.Where(a =>
                            rules.Any(r =>
                                (r.EntityName == null || r.EntityName == a.EntityName)
                                && (r.Action == null || r.Action == a.Action)
                            )
                        )
                        .ToList();

                    await TranslateDetailsAsync(list, lang);
                    await TranslateEntitiesAndActionsAsync(list, lang);
                    return Ok(list);
                }
            }

            var trails = await query.Take(500).ToListAsync();

            foreach (var trail in trails)
            {
                var userInfo = await _context
                    .Users.Where(u => u.Id == trail.UserId)
                    .Select(u => new { FullName = u.FirstName + " " + u.LastName, u.Username })
                    .FirstOrDefaultAsync();

                if (userInfo != null)
                {
                    trail.User = userInfo.FullName?.Trim() ?? trail.User;
                    trail.Username = userInfo.Username;
                }
            }

            await TranslateDetailsAsync(trails, lang);
            await TranslateEntitiesAndActionsAsync(trails, lang);

            return Ok(trails);
        }

        [HttpGet("rules")]
        public async Task<IActionResult> GetAuditTrailRules()
        {
            var userRoles = new List<string>();

            if (User.IsInRole("Admin"))
                userRoles.Add("Admin");

            if (User.IsInRole("Developer"))
                userRoles.Add("Developer");

            if (User.IsInRole("Reporter"))
                userRoles.Add("Reporter");

            if (userRoles.Count == 0)
                return Unauthorized();

            if (userRoles.Contains("Developer"))
                return await BuildAuditTrailRulesResponse(
                    new() { (EntityName: null, Action: null) }
                );

            var rules = userRoles.SelectMany(r => AuditTrailConfig.Rules[r]).Distinct().ToList();

            return await BuildAuditTrailRulesResponse(rules);
        }

        private async Task<IActionResult> BuildAuditTrailRulesResponse(
            List<(string? EntityName, string? Action)> rules
        )
        {
            var lang = await GetLangAsync();

            IEnumerable<string> entities;
            IEnumerable<string> actions;

            if (rules.Count == 1 && rules[0].Item1 == null && rules[0].Item2 == null)
            {
                entities = new[]
                {
                    "All",
                    "Category",
                    "News",
                    "NewsType",
                    "Report",
                    "Shift",
                    "ShiftTeam",
                    // "SubCategory",
                    "TrendingPanel",
                    "UnitCell",
                    "UnitColumn",
                    "Unit",
                    "UnitGroup",
                    // "User",
                    // "UserFavourites",
                    "UserManagement",
                    // "UserPreferences",
                };

                actions = new[] { "All", "Create", "Update", "Delete" };
            }
            else
            {
                entities = new[] { "All" }.Concat(
                    rules
                        .Select(r => r.Item1)
                        .Where(e => !string.IsNullOrWhiteSpace(e))
                        .Select(e => e!)
                        .Distinct()
                );

                var actionList = rules
                    .Select(r => r.Item2)
                    .Where(a => !string.IsNullOrWhiteSpace(a))
                    .Select(a => a!)
                    .Distinct()
                    .ToList();

                if (actionList.Count == 0)
                    actionList = new() { "Create", "Update", "Delete" };

                actions = new[] { "All" }.Concat(actionList);
            }

            var translatedEntities = new List<object>();
            foreach (var e in entities)
            {
                var key = e == "All" ? "AuditTrail/All" : $"AuditTrail/{e}";
                translatedEntities.Add(new { label = await _t.GetAsync(key, lang), value = e });
            }

            var translatedActions = new List<object>();
            foreach (var a in actions)
            {
                string key = a switch
                {
                    "All" => "AuditTrail/All",
                    "Create" => "AuditTrail/Created posts",
                    "Update" => "AuditTrail/Updated posts",
                    "Delete" => "AuditTrail/Deleted posts",
                    _ => "AuditTrail/All",
                };
                translatedActions.Add(new { label = await _t.GetAsync(key, lang), value = a });
            }

            return Ok(new { Entities = translatedEntities, Actions = translatedActions });
        }

        // Translation methods.
        private async Task TranslateDetailsAsync(IEnumerable<AuditTrail> items, string lang)
        {
            foreach (var entry in items)
            {
                if (string.IsNullOrWhiteSpace(entry.Details))
                    continue;

                try
                {
                    using var doc = JsonDocument.Parse(entry.Details!);
                    var translated = await TranslateJsonElementRecursiveAsync(
                        doc.RootElement,
                        _t,
                        lang
                    );
                    entry.Details = JsonSerializer.Serialize(translated);
                }
                catch { }
            }
        }

        private async Task<object?> TranslateJsonElementRecursiveAsync(
            JsonElement element,
            ITranslationService t,
            string lang
        )
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    var dict = new Dictionary<string, object?>();
                    foreach (var prop in element.EnumerateObject())
                    {
                        var key =
                            (prop.Name == "OldValues" || prop.Name == "NewValues")
                                ? prop.Name
                                : await GetTranslatedKeyAsync(prop.Name, t, lang);

                        if (prop.Name == "ViewMode" && prop.Value.ValueKind == JsonValueKind.Number)
                        {
                            var num = prop.Value.GetInt32();
                            string viewModeName = num switch
                            {
                                0 => "Value",
                                1 => "LineChart",
                                2 => "BarChart",
                                3 => "PieChart",
                                _ => num.ToString(),
                            };
                            var translated =
                                await t.GetAsync($"AuditTrail/{viewModeName}", lang)
                                ?? viewModeName;
                            dict[key] = translated;
                        }
                        else if (
                            prop.Name == "TrendingPeriod"
                            && prop.Value.ValueKind == JsonValueKind.Number
                        )
                        {
                            var num = prop.Value.GetInt32();
                            string periodName = num switch
                            {
                                0 => "AllTime",
                                1 => "Today",
                                2 => "Yesterday",
                                3 => "Weekly",
                                4 => "Monthly",
                                5 => "Quarterly",
                                6 => "Custom",
                                _ => num.ToString(),
                            };
                            var translated =
                                await t.GetAsync($"AuditTrail/{periodName}", lang) ?? periodName;
                            dict[key] = translated;
                        }
                        else if (
                            prop.Name == "PanelSize"
                            && prop.Value.ValueKind == JsonValueKind.Number
                        )
                        {
                            var num = prop.Value.GetInt32();
                            string sizeName = num switch
                            {
                                1 => "OneFourth",
                                2 => "Half",
                                3 => "ThreeFourths",
                                4 => "FullWidth",
                                _ => num.ToString(),
                            };
                            var translated =
                                await t.GetAsync($"AuditTrail/{sizeName}", lang) ?? sizeName;
                            dict[key] = translated;
                        }
                        else if (
                            prop.Name == "TrendingType"
                            && prop.Value.ValueKind == JsonValueKind.Number
                        )
                        {
                            var num = prop.Value.GetInt32();
                            string trendingType = num switch
                            {
                                0 => "Total",
                                1 => "Average",
                                _ => num.ToString(),
                            };
                            var translated =
                                await t.GetAsync($"AuditTrail/{trendingType}", lang)
                                ?? trendingType;
                            dict[key] = translated;
                        }
                        else if (
                            prop.Name == "DayOfWeek"
                            && prop.Value.ValueKind == JsonValueKind.Number
                        )
                        {
                            var num = prop.Value.GetInt32();
                            var dayName = Enum.GetName(typeof(DayOfWeek), num) ?? num.ToString();
                            var translated =
                                await t.GetAsync($"AuditTrail/{dayName}", lang) ?? dayName;
                            dict[key] = translated;
                        }
                        else
                        {
                            dict[key] = await TranslateJsonElementRecursiveAsync(
                                prop.Value,
                                t,
                                lang
                            );
                        }
                    }
                    return dict;

                case JsonValueKind.Array:
                    var list = new List<object?>();
                    foreach (var item in element.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.String)
                        {
                            var value = item.GetString();
                            if (!string.IsNullOrEmpty(value))
                            {
                                if (
                                    value.Contains("/")
                                    && !value.Contains('(')
                                    && !value.Contains(' ')
                                    && !value.Contains(':')
                                )
                                {
                                    var translated = await t.GetAsync(value, lang);
                                    list.Add(translated ?? value);
                                }
                                else if (
                                    !value.Contains('(')
                                    && !value.Contains(' ')
                                    && !value.Contains(':')
                                )
                                {
                                    var translated = await t.GetAsync($"AuditTrail/{value}", lang);
                                    list.Add(translated ?? value);
                                }
                                else
                                {
                                    list.Add(value);
                                }
                            }
                        }
                        else
                        {
                            list.Add(await TranslateJsonElementRecursiveAsync(item, t, lang));
                        }
                    }
                    return list;

                default:
                    return element.ToString();
            }
        }

        private async Task<string> GetTranslatedKeyAsync(
            string key,
            ITranslationService t,
            string lang
        )
        {
            try
            {
                var translated = await t.GetAsync($"AuditTrail/{key}", lang);

                if (string.IsNullOrWhiteSpace(translated) || translated == $"AuditTrail/{key}")
                    return key;

                return translated;
            }
            catch
            {
                return key;
            }
        }

        private async Task TranslateEntitiesAndActionsAsync(
            IEnumerable<AuditTrail> items,
            string lang
        )
        {
            foreach (var entry in items)
            {
                if (!string.IsNullOrWhiteSpace(entry.EntityName))
                {
                    var key = $"AuditTrail/{entry.EntityName}";
                    var translated = await _t.GetAsync(key, lang);
                    if (!string.IsNullOrWhiteSpace(translated) && translated != key)
                        entry.EntityName = translated;
                }

                if (!string.IsNullOrWhiteSpace(entry.Action))
                {
                    var key = $"AuditTrail/{entry.Action}";
                    var translated = await _t.GetAsync(key, lang);
                    if (!string.IsNullOrWhiteSpace(translated) && translated != key)
                        entry.Action = translated;
                }
            }
        }
    }
}
