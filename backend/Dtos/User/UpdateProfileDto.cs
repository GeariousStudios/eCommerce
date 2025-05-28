using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateProfileDto
    {
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[1] Användarnamn får inte innehålla mellanslag"
        )]
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        [RegularExpression(@"^\S+$", ErrorMessage = "[2] Lösenord får inte innehålla mellanslag")]
        public string? Password { get; set; }

        [EmailAddress(ErrorMessage = "[3] Mejladress är ogiltig")]
        public string? Email { get; set; }
    }
}
