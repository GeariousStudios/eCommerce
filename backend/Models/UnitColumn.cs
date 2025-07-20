using backend.Models.ManyToMany;

namespace backend.Models
{
    public class UnitColumn
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public UnitColumnDataType DataType { get; set; }
        public bool HasData { get; set; } = false;

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<UnitToUnitColumn> UnitToUnitColumns { get; set; } = new();
    }

    public enum UnitColumnDataType
    {
        Number,
        Text,
        Boolean,
    }
}
