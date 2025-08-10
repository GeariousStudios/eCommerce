namespace backend.Models.ManyToMany
{
    public class CategoryToSubCategory
    {
        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public int SubCategoryId { get; set; }
        public SubCategory SubCategory { get; set; } = null!;

        public int Order { get; set; }
    }
}
