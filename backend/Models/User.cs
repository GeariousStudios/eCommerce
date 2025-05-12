using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    [Flags]
    public enum UserRoles
    {
        None = 0,
        Admin = 1,
        Developer = 2,
    }

    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRoles Roles { get; set; }

        public UserPreferences UserPreferences { get; set; } = null!;
        public string PasswordHash { get; set; } = string.Empty;

        [NotMapped]
        public string Password
        {
            set => PasswordHash = BCrypt.Net.BCrypt.HashPassword(value);
        }

        public bool VerifyPassword(string password)
        {
            return BCrypt.Net.BCrypt.Verify(password, PasswordHash);
        }

        public string? CurrentSessionId { get; set; }
        public bool IsOnline { get; set; } = false;
        public bool IsLocked { get; set; }
    }
}
