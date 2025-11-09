using backend.Dtos.SubCategory;
using backend.Dtos.Unit;

namespace backend.Dtos.Category
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<UnitDto> Units { get; set; } = new();
        public List<SubCategoryDto> SubCategories { get; set; } = new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
