using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.ShiftTeam
{
    public class UpdateShiftTeamDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        [MaxLength(7, ErrorMessage = "[3|ShiftTeam/a color] Validation/cannot exceed")]
        [RegularExpression(
            "^#([0-9A-Fa-f]{6})$",
            ErrorMessage = "[4|ShiftTeam/Color format] Validation/Invalid format"
        )]
        public string ColorHex { get; set; } = "#e0e0e0";
    }
}
