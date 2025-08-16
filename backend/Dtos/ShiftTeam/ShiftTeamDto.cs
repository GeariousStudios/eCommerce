using backend.Dtos.Shift;

namespace backend.Dtos.ShiftTeam
{
    public class ShiftTeamDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public string ColorHex { get; set; } = "#e0e0e0";
        public string TextColorHex { get; set; } = "#000000";
        public List<ShiftDto> Shifts { get; set; } = new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
