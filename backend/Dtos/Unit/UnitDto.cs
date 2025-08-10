using backend.Models;

namespace backend.Dtos.Unit
{
    public class UnitDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UnitGroupId { get; set; }
        public string UnitGroupName { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public List<int> UnitColumnIds { get; set; } = new();
        public List<int> CategoryIds { get; set; } = new();
        public List<int> ShiftIds { get; set; } = new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
