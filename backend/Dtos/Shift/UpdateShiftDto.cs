using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Shift
{
    public class UpdateShiftDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        public List<int> ShiftTeamIds { get; set; } = new();
        public Dictionary<int, string>? ShiftTeamDisplayNames { get; set; }
        public Dictionary<int, TimeSpan>? ShiftTeamStartTimes { get; set; }
        public Dictionary<int, TimeSpan>? ShiftTeamEndTimes { get; set; }
    }
}
