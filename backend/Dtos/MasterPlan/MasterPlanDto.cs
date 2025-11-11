using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class MasterPlanDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UnitGroupId { get; set; }
        public string UnitGroupName { get; set; } = string.Empty;
        public List<UnitDto> Units { get; set; } = new();
        public List<MasterPlanFieldDto> Fields { get; set; } = new();
        public List<MasterPlanElementDto> Elements { get; set; } = new();
        public bool AllowRemovingElements { get; set; }
        public bool IsHidden { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        // Check-out system.
        public bool IsCheckedOut { get; set; } = false;
        public string? CheckedOutBy { get; set; }
        public DateTime? CheckedOutAt { get; set; }
    }
}
