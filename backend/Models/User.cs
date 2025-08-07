using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
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
        public DateTime CreationDate { get; set; }
        public DateTime? LastLogin { get; set; }
    }

    [Flags]
    public enum UserRoles
    {
        None = 0,
        Admin = 1,
        Developer = 2,
        Reporter = 4,
        Master = 8,
    }

    public class UserPreferences
    {
        public int Id { get; set; }
        public string Theme { get; set; } = "light";
        public string Language { get; set; } = "sv";
        public bool IsGridView { get; set; } = false;
        public int UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
