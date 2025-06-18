namespace backend.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<Unit>? Units { get; set; }
        public ICollection<SubCategory>? SubCategories { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }

    public class SubCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;
    }
}
