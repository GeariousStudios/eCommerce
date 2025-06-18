namespace backend.Dtos.Category
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<string> Units { get; set; } = new();
        public List<string> SubCategories { get; set; } = new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
