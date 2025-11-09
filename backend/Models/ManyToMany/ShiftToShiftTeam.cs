using System.ComponentModel.DataAnnotations;

namespace backend.Models.ManyToMany
{
    public class ShiftToShiftTeam
    {
        public int ShiftId { get; set; }
        public Shift Shift { get; set; } = null!;

        public int ShiftTeamId { get; set; }
        public ShiftTeam ShiftTeam { get; set; } = null!;

        [MaxLength(32)]
        public string? DisplayName { get; set; }

        public int Order { get; set; }
    }
}
