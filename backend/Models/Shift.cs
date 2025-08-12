using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public enum ShiftSystemKey
    {
        Unmanned,
    }

    public class Shift
    {
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        public ShiftSystemKey? SystemKey { get; set; }
        public bool IsSystem => SystemKey != null;

        public int CycleLengthWeeks { get; set; } = 1;
        public DateOnly AnchorWeekStart { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<UnitToShift> UnitToShifts { get; set; } = new();
        public List<ShiftToShiftTeam> ShiftToShiftTeams { get; set; } = new();
        public List<ShiftToShiftTeamSchedule> ShiftToShiftTeamSchedules { get; set; } = new();
    }
}
