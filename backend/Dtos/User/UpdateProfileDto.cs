using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateProfileDto
    {
        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[1|User/Username] Validation/cannot contain spaces"
        )]
        [MaxLength(16, ErrorMessage = "[2|User/Username] Validation/cannot exceed")]
        public string? Username { get; set; }

        [MaxLength(32, ErrorMessage = "[3|User/First name] Validation/cannot exceed")]
        public string? FirstName { get; set; }

        [MaxLength(32, ErrorMessage = "[4|User/Last name] Validation/cannot exceed")]
        public string? LastName { get; set; }

        [RegularExpression(
            @"^\S+$",
            ErrorMessage = "[5|User/Password] Validation/cannot contain spaces"
        )]
        [MaxLength(128, ErrorMessage = "[6|User/Password] Validation/cannot exceed")]
        public string? Password { get; set; }

        [EmailAddress(ErrorMessage = "[7|User/Email] Validation/is invalid")]
        [MaxLength(320, ErrorMessage = "[8|User/Email] Validation/cannot exceed")]
        public string? Email { get; set; }
    }
}
