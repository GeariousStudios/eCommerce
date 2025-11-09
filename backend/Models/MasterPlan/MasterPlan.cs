using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class MasterPlan
    {
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public int UnitGroupId { get; set; }
        public required UnitGroup UnitGroup { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        // Check-out system.
        public bool IsCheckedOut { get; set; } = false;
        public string? CheckedOutBy { get; set; }
        public DateTime? CheckedOutAt { get; set; }

        public List<MasterPlanToMasterPlanField> MasterPlanToMasterPlanFields { get; set; } = new();
        public List<MasterPlanToMasterPlanElement> MasterPlanToMasterPlanElements { get; set; } =
            new();
    }
}
