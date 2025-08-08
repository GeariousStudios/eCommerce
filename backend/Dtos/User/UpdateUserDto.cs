using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateUserDto
    {
        [MaxLength(32, ErrorMessage = "[1|User/First name] Validation/cannot exceed")]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(32, ErrorMessage = "[2|User/Last name] Validation/cannot exceed")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|User/a username] Validation/Please enter")]
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[4|User/Username] Validation/cannot contain spaces"
        )]
        [MaxLength(16, ErrorMessage = "[5|User/Username] Validation/cannot exceed")]
        public string Username { get; set; } = string.Empty;

        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[6|User/Password] Validation/cannot contain spaces"
        )]
        [MaxLength(128, ErrorMessage = "[7|User/Password] Validation/cannot exceed")]
        public string? Password { get; set; }

        [EmailAddress(ErrorMessage = "[8|User/Email] Validation/is invalid")]
        [MaxLength(320, ErrorMessage = "[9|User/Email] Validation/cannot exceed")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "[10|User/at least one role] Validation/Please enter")]
        public string[] Roles { get; set; } = Array.Empty<string>();

        public bool IsLocked { get; set; }
    }
}
