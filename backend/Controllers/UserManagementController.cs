using backend.Data;
using backend.Dtos.User;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Authorize(Roles = "Developer")]
    [Route("user-management")]
    public class UserManagementController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _t;
        private readonly AuditTrailService _audit;

        public UserManagementController(
            AppDbContext context,
            ITranslationService t,
            AuditTrailService audit
        )
        {
            _context = context;
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
            [FromQuery] bool? isLocked = null,
            [FromQuery] string[]? roles = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10
        )
        {
            IQueryable<User> query = _context.Users;

            if (isLocked.HasValue)
            {
                query = query.Where(u => u.IsLocked == isLocked.Value);
            }

            if (roles is { Length: > 0 })
            {
                UserRoles roleFilter = UserRoles.None;

                foreach (var role in roles)
                {
                    if (Enum.TryParse<UserRoles>(role, true, out var parsedRole))
                    {
                        roleFilter |= parsedRole;
                    }
                }
                query = query.Where(u => (u.Roles & roleFilter) != 0);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowered = search.ToLower();
                query = query.Where(u =>
                    u.Username.ToLower().Contains(lowered)
                    || u.FirstName.ToLower().Contains(lowered)
                    || u.LastName.ToLower().Contains(lowered)
                    || u.Email.ToLower().Contains(lowered)
                );
            }

            query = sortBy.ToLower() switch
            {
                "username" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Username.ToLower())
                    : query.OrderBy(u => u.Username.ToLower()),
                "firstname" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.FirstName.ToLower())
                    : query.OrderBy(u => u.FirstName.ToLower()),
                "lastname" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.LastName.ToLower())
                    : query.OrderBy(u => u.LastName.ToLower()),
                "email" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Email.ToLower())
                    : query.OrderBy(u => u.Email.ToLower()),
                "islocked" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.IsLocked)
                    : query.OrderBy(u => u.IsLocked),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Id)
                    : query.OrderBy(u => u.Id),
            };

            var totalCount = await query.CountAsync();

            List<User> users;

            if (sortBy.ToLower() == "roles")
            {
                users = await query.ToListAsync();
                totalCount = users.Count;

                users =
                    sortOrder == "desc"
                        ? users
                            .OrderByDescending(u => string.Join(",", u.GetRoleStrings()))
                            .ToList()
                        : users.OrderBy(u => string.Join(",", u.GetRoleStrings())).ToList();

                users = users.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            }
            else
            {
                totalCount = await query.CountAsync();
                users = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            }

            // Filters.
            var status = new Dictionary<string, int>
            {
                ["Unlocked"] = await _context.Users.CountAsync(u => !u.IsLocked),
                ["Locked"] = await _context.Users.CountAsync(u => u.IsLocked),
            };

            var adminCount = await _context.Users.CountAsync(u => u.Roles.HasFlag(UserRoles.Admin));
            var developerCount = await _context.Users.CountAsync(u =>
                u.Roles.HasFlag(UserRoles.Developer)
            );
            var reporterCount = await _context.Users.CountAsync(u =>
                u.Roles.HasFlag(UserRoles.Reporter)
            );

            var result = new
            {
                totalCount,
                items = users.Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    Roles = u.GetRoleStrings(),
                    IsLocked = u.IsLocked,

                    // Meta data.
                    IsOnline = u.IsOnline,
                    CreationDate = u.CreationDate,
                    LastLogin = u.LastLogin,
                }),
                counts = new
                {
                    adminCount = adminCount,
                    developerCount = developerCount,
                    reporterCount = reporterCount,
                    status = status,
                },
            };

            return Ok(result);
        }

        [HttpGet("fetch/{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var lang = await GetLangAsync();
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = await _t.GetAsync("Users/NotFound", lang) });
            }

            var result = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Roles = user.GetRoleStrings(),
                IsLocked = user.IsLocked,

                // Meta data.
                IsOnline = user.IsOnline,
                CreationDate = user.CreationDate,
                LastLogin = user.LastLogin,
            };

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var lang = await GetLangAsync();
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = await _t.GetAsync("Users/NotFound", lang) });
            }

            if (user.IsOnline)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Users/CannotDeleteOnline", lang) }
                );
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = await _t.GetAsync("Users/Deleted", lang) });
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateUser(CreateUserDto dto)
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

            var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == dto.Username.ToLower()
            );

            if (existingUser != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Users/UsernameTaken", lang) });
            }

            // Parse from string to enum.
            UserRoles userRoles = UserRoles.None;
            foreach (var role in dto.Roles)
            {
                if (Enum.TryParse<UserRoles>(role, true, out var parsedRole))
                {
                    userRoles |= parsedRole;
                }
                else
                {
                    return BadRequest(
                        new
                        {
                            message = string.Format(
                                await _t.GetAsync("Users/InvalidRole", lang),
                                role
                            ),
                        }
                    );
                }
            }

            var user = new User
            {
                Username = dto.Username,
                FirstName = dto.FirstName ?? "",
                LastName = dto.LastName ?? "",
                Password = dto.Password,
                Email = dto.Email ?? "",
                Roles = userRoles,
                IsLocked = dto.IsLocked,
                CreationDate = DateTime.UtcNow,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Roles = user.GetRoleStrings(),
                IsLocked = user.IsLocked,
                IsOnline = user.IsOnline,
                CreationDate = user.CreationDate,
                LastLogin = user.LastLogin,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto)
        {
            var lang = await GetLangAsync();
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = await _t.GetAsync("Users/NotFound", lang) });
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

            var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == dto.Username.ToLower() && u.Id != id
            );

            if (existingUser != null)
            {
                return BadRequest(new { message = await _t.GetAsync("Users/UsernameTaken", lang) });
            }

            // Parse from string to enum.
            UserRoles userRoles = UserRoles.None;
            foreach (var role in dto.Roles)
            {
                if (Enum.TryParse<UserRoles>(role, true, out var parsedRole))
                {
                    userRoles |= parsedRole;
                }
                else
                {
                    return BadRequest(
                        new
                        {
                            message = string.Format(
                                await _t.GetAsync("Users/InvalidRole", lang),
                                role
                            ),
                        }
                    );
                }
            }

            if (user.IsOnline)
            {
                if (user.Username != dto.Username)
                {
                    return BadRequest(
                        new
                        {
                            message = await _t.GetAsync("Users/CannotChangeUsernameOnline", lang),
                        }
                    );
                }

                if (!string.IsNullOrWhiteSpace(dto.Password))
                {
                    return BadRequest(
                        new
                        {
                            message = await _t.GetAsync("Users/CannotChangePasswordOnline", lang),
                        }
                    );
                }

                if (user.Roles != userRoles)
                {
                    return BadRequest(
                        new { message = await _t.GetAsync("Users/CannotChangeRolesOnline", lang) }
                    );
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Password) && dto.Password.Length < 8)
            {
                return BadRequest(
                    new { message = await _t.GetAsync("Users/PasswordTooShort", lang) }
                );
            }

            user.Username = dto.Username;
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Email = dto.Email ?? "";
            user.Roles = userRoles;
            user.IsLocked = dto.IsLocked;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.Password = dto.Password;
            }

            await _context.SaveChangesAsync();

            var result = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Roles = user.GetRoleStrings(),
                IsLocked = user.IsLocked,
                IsOnline = user.IsOnline,
                CreationDate = user.CreationDate,
                LastLogin = user.LastLogin,
            };

            return Ok(result);
        }

        [HttpGet("list")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserList()
        {
            var users = await _context
                .Users.OrderBy(u => u.Username)
                .Select(u => new
                {
                    label = string.IsNullOrWhiteSpace(u.FirstName)
                    && string.IsNullOrWhiteSpace(u.LastName)
                        ? u.Username
                        : $"{u.FirstName} {u.LastName}".Trim() + $" ({u.Username})",
                    value = u.Username,
                    username = u.Username,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                })
                .ToListAsync();

            return Ok(users);
        }
    }

    public static class UserExtensions
    {
        public static string[] GetRoleStrings(this User user)
        {
            return Enum.GetValues(typeof(UserRoles))
                .Cast<UserRoles>()
                .Where(r => r != UserRoles.None && user.Roles.HasFlag(r))
                .Select(r => r.ToString())
                .ToArray();
        }
    }
}
