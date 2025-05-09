namespace backend.Dtos.User
{
    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Theme { get; set; } = "light";
    }
}
