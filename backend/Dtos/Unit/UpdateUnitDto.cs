using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.Unit
{
    public class UpdateUnitDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[2] Välj en enhetsgrupp")]
        public int UnitGroupId { get; set; }
        public bool IsHidden { get; set; }
    }
}
