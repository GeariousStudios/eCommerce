using backend.Dtos.ShiftTeam;
using backend.Dtos.Unit;
using backend.Models;

namespace backend.Dtos.Shift
{
    public class ShiftDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ShiftSystemKey? SystemKey { get; set; }
        public bool IsHidden { get; set; }
        public string LightColorHex { get; set; } = "#212121";
        public string DarkColorHex { get; set; } = "#e0e0e0";
        public string LightTextColorHex { get; set; } = "#ffffff";
        public string DarkTextColorHex { get; set; } = "#000000";
        public bool ReverseColor { get; set; }

        public List<UnitDto> Units { get; set; } = new();
        public List<ShiftTeamDto> ShiftTeams { get; set; } = new();
        public List<ShiftTeamSpanDto> ShiftTeamSpans { get; set; } = new();
        public List<int> ShiftTeamIds { get; set; } = new();
        public Dictionary<int, string>? ShiftTeamDisplayNames { get; set; }

        public int CycleLengthWeeks { get; set; }
        public DateOnly AnchorWeekStart { get; set; }
        public List<WeeklyTimeDto> WeeklyTimes { get; set; } = new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
