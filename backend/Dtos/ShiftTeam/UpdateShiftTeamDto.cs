using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.ShiftTeam
{
    public class UpdateShiftTeamDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        [MaxLength(7, ErrorMessage = "[3|Common/a color|7] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[4|Common/Color format] Validation/is invalid"
        )]
        public string LightColorHex { get; set; } = "#212121";

        [MaxLength(7, ErrorMessage = "[5|Common/a color|7] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[6|Common/Color format] Validation/is invalid"
        )]
        public string DarkColorHex { get; set; } = "#e0e0e0";
    }
}
