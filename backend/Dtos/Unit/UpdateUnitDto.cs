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

        [MaxLength(7, ErrorMessage = "[4|Common/a color|7] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[5|Common/Color format] Validation/is invalid"
        )]
        public string LightColorHex { get; set; } = "#212121";

        [MaxLength(7, ErrorMessage = "[6|Common/a color|7] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[7|Common/Color format] Validation/is invalid"
        )]
        public string DarkColorHex { get; set; } = "#e0e0e0";
        public bool IsHidden { get; set; }

        public List<int> UnitColumnIds { get; set; } = new();
        public List<int> CategoryIds { get; set; } = new();
        public List<int> ShiftIds { get; set; } = new();
        public List<int> StopTypeIds { get; set; } = new();
    }
}
