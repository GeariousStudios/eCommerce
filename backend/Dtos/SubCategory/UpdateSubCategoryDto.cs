using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.SubCategory
{
    public class UpdateSubCategoryDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        public string Name { get; set; } = string.Empty;
        public int[]? CategoryIds { get; set; }
    }
}
