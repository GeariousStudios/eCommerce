using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "[1|User/a username] Validation/Please enter")]
        [RegularExpression(@"^\S+$", ErrorMessage = "[2|User/Username] Validation/cannot contain spaces")]
        public string Username { get; set; } = string.Empty;

        [RegularExpression(@"^\S+$", ErrorMessage = "[3|User/Password] Validation/cannot contain spaces")]
        public string Password { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "[4|User/Email] Validation/is invalid")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "[5|User/at least one role] Validation/Please enter")]
        public string[] Roles { get; set; } = Array.Empty<string>();
        public bool IsLocked { get; set; }
    }
}
