using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Category
{
    public class CreateCategoryDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public int[]? Units { get; set; }
        public int[]? SubCategoryIds { get; set; }
        public string[]? NewSubCategoryNames { get; set; }
    }
}
