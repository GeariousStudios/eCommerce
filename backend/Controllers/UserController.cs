using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.Dtos.User;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace backend.Controllers
{
    [ApiController]
    [Route("user")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public UserController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Användarnamn och lösenord måste fyllas i" });
            }

            var user = await _context
                .Users.Include(u => u.UserPreferences)
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (user == null)
            {
                return Unauthorized(new { message = "Felaktigt användarnamn eller lösenord" });
            }

            if (user.IsLocked)
            {
                return Unauthorized(new { message = "Användaren är låst" });
            }

            if (!user.VerifyPassword(dto.Password))
            {
                return Unauthorized(new { message = "Felaktigt användarnamn eller lösenord" });
            }

            await _context.SaveChangesAsync();

            await SetUserPreferences(user, dto.Theme);

            // JWT-token.
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _configuration["Jwt:Key"];
            var key = Encoding.UTF8.GetBytes(jwtKey!);
            var tokenId = Guid.NewGuid().ToString();

            var claims = new List<Claim> { new Claim(ClaimTypes.Name, user!.Username) };

            foreach (UserRoles role in Enum.GetValues(typeof(UserRoles)))
            {
                if (role != UserRoles.None && user.Roles.HasFlag(role))
                {
                    claims.Add(new Claim(ClaimTypes.Role, role.ToString()));
                }
            }

            claims.Add(new Claim(JwtRegisteredClaimNames.Jti, tokenId));

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                ),
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            user.CurrentSessionId = tokenId;
            user.IsOnline = true;
            user.LastLogin = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var returnedMessage = "";

            if (
                !string.IsNullOrWhiteSpace(user.FirstName)
                && string.IsNullOrWhiteSpace(user.LastName)
            )
            {
                returnedMessage = user.FirstName;
            }
            else if (
                !string.IsNullOrWhiteSpace(user.LastName)
                && string.IsNullOrWhiteSpace(user.FirstName)
            )
            {
                returnedMessage = user.LastName;
            }
            else if (
                !string.IsNullOrWhiteSpace(user.FirstName)
                && !string.IsNullOrWhiteSpace(user.LastName)
            )
            {
                returnedMessage = user.FirstName + " " + user.LastName;
            }
            else
            {
                returnedMessage = user.Username;
            }

            return Ok(new { message = returnedMessage, token = jwt });
        }

        [HttpGet("check-login")]
        public IActionResult CheckLogin()
        {
            var isLoggedIn = User.Identity?.IsAuthenticated ?? false;
            return Ok(new { isLoggedIn });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var loggedInUser = User.Identity?.Name;

            if (loggedInUser == null)
            {
                return BadRequest(new { message = "Ingen användare är inloggad" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == loggedInUser);

            if (user == null)
            {
                return NotFound(new { message = "Användaren kunde inte hittas" });
            }

            user.IsOnline = false;
            user.CurrentSessionId = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Utloggning lyckades!" });
        }

        [HttpGet("info")]
        public async Task<IActionResult> Info()
        {
            var loggedInUser = User.Identity?.Name;

            if (loggedInUser == null)
            {
                return NotFound(new { message = "Ingen användare är inloggad" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == loggedInUser);

            if (user == null)
            {
                return NotFound(new { message = "Användaren kunde inte hittas" });
            }

            var roles = user
                .Roles.ToString()
                .Split(", ", StringSplitOptions.RemoveEmptyEntries)
                .ToList();

            return Ok(
                new
                {
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    username = user.Username,
                    roles,
                }
            );
        }

        private async Task SetUserPreferences(User user, string theme)
        {
            if (user.UserPreferences == null)
            {
                user.UserPreferences = new UserPreferences
                {
                    Theme = (theme == "dark" || theme == "light") ? theme : "light",
                };

                await _context.SaveChangesAsync();
            }
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                return BadRequest(new { message = "Valideringsfel", errors });
            }

            var username = User.Identity?.Name;
            if (username == null)
            {
                return Unauthorized();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
            {
                return NotFound(new { message = "Användaren kunde inte hittas" });
            }

            // Username.
            if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username != user.Username)
            {
                var existingUser = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Username.ToLower() == dto.Username.ToLower()
                );

                if (existingUser != null)
                {
                    return BadRequest(new { message = "Användarnamnet är upptaget" });
                }

                user.Username = dto.Username;
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.Password = dto.Password;
            }

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
            {
                user.FirstName = dto.FirstName;
            }

            if (!string.IsNullOrWhiteSpace(dto.LastName))
            {
                user.LastName = dto.LastName;
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                user.Email = dto.Email;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profil uppdaterad!" });
        }
    }
}
