using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.Unit
{
    public class UpdateUnitDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[2|Unit/a group] Validation/Please select")]
        public int UnitGroupId { get; set; }
        public List<int> UnitColumnIds { get; set; } = new();
        public List<int> CategoryIds { get; set; } = new();
        public bool IsHidden { get; set; }
    }
}
