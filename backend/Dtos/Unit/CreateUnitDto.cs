using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.Unit
{
    public class CreateUnitDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[2] Välj en grupp")]
        public int UnitGroupId { get; set; }
        public List<int> UnitColumnIds { get; set; } = new();
        public List<int> CategoryIds { get; set; } = new();
        public bool IsHidden { get; set; }
    }
}
