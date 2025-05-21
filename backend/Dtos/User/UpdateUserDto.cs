using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "[1] Fyll i användarnamn")]
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[2] Användarnamn får inte innehålla mellanslag"
        )]
        public string Username { get; set; } = string.Empty;

        [RegularExpression(@"^\S+$", ErrorMessage = "[3] Lösenord får inte innehålla mellanslag")]
        public string Password { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "[4] Mejladress är ogiltig")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "[5] Välj minst en roll")]
        public string[] Roles { get; set; } = Array.Empty<string>();
        public bool IsLocked { get; set; }
    }
}
