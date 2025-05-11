using backend.Data;
using backend.Dtos.User;
using backend.Models;
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

        public UserManagementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string sortBy = "id",
            [FromQuery] string sortOrder = "asc",
            [FromQuery] bool? isLocked = null
        )
        {
            IQueryable<User> query = _context.Users;

            if (isLocked.HasValue)
            {
                query = query.Where(u => u.IsLocked == isLocked.Value);
            }

            query = sortBy.ToLower() switch
            {
                "username" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Username)
                    : query.OrderBy(u => u.Username),
                "name" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Name)
                    : query.OrderBy(u => u.Name),
                "email" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Email)
                    : query.OrderBy(u => u.Email),
                "roles" => sortOrder == "desc"
                    ? query.OrderByDescending(u => (int)u.Roles)
                    : query.OrderBy(u => (int)u.Roles),
                "isLocked" => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.IsLocked)
                    : query.OrderBy(u => u.IsLocked),
                _ => sortOrder == "desc"
                    ? query.OrderByDescending(u => u.Id)
                    : query.OrderBy(u => u.Id),
            };

            var users = await query.ToListAsync();

            var result = users.Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Name = u.Name,
                Email = u.Email,
                Roles = u.GetRoleStrings(),
                IsLocked = u.IsLocked,

                // Meta data.
                IsOnline = u.IsOnline,
            });

            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = "Användare hittades ej i databasen." });
            }

            if (user.IsOnline)
            {
                return BadRequest(
                    new { message = "Kan ej ta bort kontot - användaren är inloggad." }
                );
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Användare borttagen!" });
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateUser(CreateUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username))
            {
                return BadRequest(new { message = "Fyll i användarnamn." });
            }

            var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == dto.Username.ToLower()
            );

            if (existingUser != null)
            {
                return BadRequest(new { message = "Användarnamnet är upptaget." });
            }

            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Fyll i lösenord." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Fyll i mejladress." });
            }

            if (dto.Roles == null || dto.Roles.Length == 0)
            {
                return BadRequest(new { message = "Välj minst en roll." });
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
                    return BadRequest(new { message = $"Ogiltig roll: {role}" });
                }
            }

            var user = new User
            {
                Username = dto.Username,
                Name = dto.Name ?? "",
                Password = dto.Password,
                Email = dto.Email,
                Roles = userRoles,
                IsLocked = dto.IsLocked,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Name = user.Name,
                Email = user.Email,
                Roles = user.GetRoleStrings(),
                IsLocked = user.IsLocked,
            };

            return Ok(result);
        }

        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new { message = "Användare hittades ej i databasen." });
            }

            var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == dto.Username.ToLower() && u.Id != id
            );

            if (existingUser != null)
            {
                return BadRequest(new { message = "Användarnamnet är upptaget." });
            }

            if (string.IsNullOrWhiteSpace(dto.Username))
            {
                return BadRequest(new { message = "Fyll i användarnamn." });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Fyll i mejladress." });
            }

            if (dto.Roles == null || dto.Roles.Length == 0)
            {
                return BadRequest(new { message = "Välj minst en roll." });
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
                    return BadRequest(new { message = $"Ogiltig roll: {role}" });
                }
            }

            user.Username = dto.Username;
            user.Name = dto.Name;
            user.Email = dto.Email;
            user.Roles = userRoles;
            user.IsLocked = dto.IsLocked;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.Password = dto.Password;
            }

            var result = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Name = user.Name,
                Email = user.Email,
                Roles = user.GetRoleStrings(),
                IsLocked = user.IsLocked,
            };

            await _context.SaveChangesAsync();
            return Ok(result);
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
