using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Category
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;
        public int[]? Units { get; set; }
        public int[]? SubCategoryIds { get; set; }
        public string[]? NewSubCategoryNames { get; set; }
    }
}
