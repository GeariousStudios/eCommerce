using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateProfileDto
    {
        [RegularExpression(@"^\S+$", ErrorMessage = "[1|User/Username] Validation/cannot contain spaces")]
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        [RegularExpression(@"^\S+$", ErrorMessage = "[2|User/Password] Validation/cannot contain spaces")]
        public string? Password { get; set; }

        [EmailAddress(ErrorMessage = "[3|User/Email] Validation/is invalid")]
        public string? Email { get; set; }
    }
}
