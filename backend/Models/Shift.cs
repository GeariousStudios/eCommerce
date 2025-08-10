using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public enum ShiftSystemKey
    {
        None,
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

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<UnitToShift> UnitToShifts { get; set; } = new();
        public List<ShiftToShiftTeam> ShiftToShiftTeams { get; set; } = new();
    }
}
