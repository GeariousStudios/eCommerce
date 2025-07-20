using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.SubCategory
{
    public class CreateSubCategoryDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;
        public int[]? CategoryIds { get; set; }
    }
}
