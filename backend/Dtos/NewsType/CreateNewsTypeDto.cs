using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.NewsType
{
    public class CreateNewsTypeDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;
    }
}
