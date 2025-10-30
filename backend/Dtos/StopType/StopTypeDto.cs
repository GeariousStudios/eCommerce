using backend.Dtos.Unit;

namespace backend.Dtos.StopType
{
    public class StopTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string LightColorHex { get; set; } = "#212121";
        public string DarkColorHex { get; set; } = "#e0e0e0";
        public string LightTextColorHex { get; set; } = "#ffffff";
        public string DarkTextColorHex { get; set; } = "#000000";
        public List<UnitDto> Units { get; set; } = new();
        public bool IsHidden { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
