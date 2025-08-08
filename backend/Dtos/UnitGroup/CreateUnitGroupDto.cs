using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.UnitGroup
{
    public class CreateUnitGroupDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        public string Name { get; set; } = string.Empty;
    }
}
