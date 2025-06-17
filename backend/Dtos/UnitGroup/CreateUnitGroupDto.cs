using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.UnitGroup
{
    public class CreateUnitGroupDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;
    }
}
