using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.Unit
{
    public class UpdateUnitDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(16, ErrorMessage = "[2|Common/Name] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|Unit/a group] Validation/Please select")]
        public int UnitGroupId { get; set; }
        public List<int> UnitColumnIds { get; set; } = new();
        public List<int> CategoryIds { get; set; } = new();
        public bool IsHidden { get; set; }
    }
}
