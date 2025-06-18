using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Category
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;
        public int[]? Units { get; set; }
        public string[]? SubCategories { get; set; }
    }
}
