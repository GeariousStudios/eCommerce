namespace backend.Dtos.Category
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string[]? Units { get; set; }
        public string[]? SubCategories { get; set; }
    }
}
