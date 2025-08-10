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

        public List<UnitDto> Units { get; set; } = new();
        public List<ShiftTeamDto> ShiftTeams { get; set; } = new();

        public Dictionary<int, string>? ShiftTeamDisplayNames { get; set; }
        public Dictionary<int, TimeSpan>? ShiftTeamStartTimes { get; set; }
        public Dictionary<int, TimeSpan>? ShiftTeamEndTimes { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
