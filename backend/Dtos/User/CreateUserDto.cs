using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class CreateUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "[1] Fyll i användarnamn")]
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[2] Användarnamn får inte innehålla mellanslag"
        )]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3] Fyll i lösenord")]
        [RegularExpression(@"^\S+$", ErrorMessage = "[4] Lösenord får inte innehålla mellanslag")]
        public string Password { get; set; } = string.Empty;

        // [Required(ErrorMessage = "[5] Fyll i mejladress")]
        [EmailAddress(ErrorMessage = "[6] Mejladress är ogiltig")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "[7] Välj minst en roll")]
        public string[] Roles { get; set; } = Array.Empty<string>();
        public bool IsLocked { get; set; }
    }
}
