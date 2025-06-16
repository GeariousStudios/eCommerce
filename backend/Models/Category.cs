namespace backend.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public SubCategory[]? SubCategories { get; set; }
    }

    public class SubCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
