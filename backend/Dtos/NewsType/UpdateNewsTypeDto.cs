using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.NewsType
{
    public class UpdateNewsTypeDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        public string Name { get; set; } = string.Empty;
    }
}
