using System.ComponentModel.DataAnnotations;

namespace backend.Models.ManyToMany
{
    public class ShiftToShiftTeamSchedule
    {
        public int ShiftId { get; set; }
        public Shift Shift { get; set; } = null!;

        public int ShiftTeamId { get; set; }
        public ShiftTeam ShiftTeam { get; set; } = null!;

        public int WeekIndex { get; set; }
        public DayOfWeek? DayOfWeek { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        public int Order { get; set; }
    }
}
