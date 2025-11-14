using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class ShiftTeam
    {
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        [MaxLength(7)]
        public string LightColorHex { get; set; } = "#212121";

        [MaxLength(7)]
        public string DarkColorHex { get; set; } = "#e0e0e0";
        public bool ReverseColor { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<ShiftToShiftTeam> ShiftToShiftTeams { get; set; } = new();
        public List<ShiftToShiftTeamSchedule> ShiftToShiftTeamSchedules { get; set; } = new();
    }
}
