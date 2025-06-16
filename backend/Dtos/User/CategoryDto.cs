namespace backend.Dtos.User
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string[]? SubCategories { get; set; }
    }
}
