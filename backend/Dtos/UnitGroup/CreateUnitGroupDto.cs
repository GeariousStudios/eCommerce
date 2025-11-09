using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.UnitGroup
{
    public class CreateUnitGroupDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(16, ErrorMessage = "[2|Common/Name] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
    }
}
