using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.User
{
    public class UpdateCategoryDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;

        public string[]? SubCategories { get; set; }
    }
}
