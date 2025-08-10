namespace backend.Models.ManyToMany
{
    public class ShiftToShiftTeam
    {
        public int ShiftId { get; set; }
        public Shift Shift { get; set; } = null!;

        public int ShiftTeamId { get; set; }
        public ShiftTeam ShiftTeam { get; set; } = null!;

        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        public int Order { get; set; }
    }
}
