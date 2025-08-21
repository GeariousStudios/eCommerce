using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Shift
{
    public class UpdateShiftDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        public List<int> ShiftTeamIds { get; set; } = new();
        public Dictionary<int, string>? ShiftTeamDisplayNames { get; set; }

        public int CycleLengthWeeks { get; set; }
        public DateOnly AnchorWeekStart { get; set; }

        [Required]
        public List<WeeklyTimeDto> WeeklyTimes { get; set; } = new();
    }
}
