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

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
