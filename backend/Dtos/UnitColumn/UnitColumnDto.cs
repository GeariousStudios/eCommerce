using backend.Models;

namespace backend.Dtos.UnitColumn
{
    public class UnitColumnDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public UnitColumnDataType DataType { get; set; }
        public List<string> Units { get; set; } = new();
        public bool HasData { get; set; }
        public bool Compare { get; set; }
        public string ComparisonText { get; set; } = string.Empty;

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
