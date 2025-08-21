using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class CreateUserDto
    {
        [MaxLength(32, ErrorMessage = "[1|User/First name|32] Validation/cannot exceed")]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(32, ErrorMessage = "[2|User/Last name|32] Validation/cannot exceed")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|User/a username] Validation/Please enter")]
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[4|User/Username] Validation/cannot contain spaces"
        )]
        [MaxLength(16, ErrorMessage = "[5|User/Username|16] Validation/cannot exceed")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "[6|User/a password] Validation/Please enter")]
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[7|User/Password] Validation/cannot contain spaces"
        )]
        [MinLength(8, ErrorMessage = "[8|User/Password|8] Validation/must be at least")]
        [MaxLength(128, ErrorMessage = "[9|User/Password|128] Validation/cannot exceed")]
        public string Password { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "[10|User/Email] Validation/is invalid")]
        [MaxLength(320, ErrorMessage = "[11|User/Email|320] Validation/cannot exceed")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "[12|User/at least one role] Validation/Please enter")]
        public string[] Roles { get; set; } = Array.Empty<string>();

        public bool IsLocked { get; set; }
    }
}
