namespace backend.Dtos.User
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string[] Roles { get; set; } = Array.Empty<string>();
        public bool IsLocked { get; set; }

        // Meta data.
        public bool IsOnline { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime? LastLogin { get; set; }
    }
}
