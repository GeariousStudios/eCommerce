using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.MasterPlan
{
    public class CreateMasterPlanDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|MasterPlan/a group] Validation/Please select")]
        public int UnitGroupId { get; set; }
        public bool IsHidden { get; set; }
        public bool AllowRemovingElements { get; set; }
        public int[]? Units { get; set; }
        public int[]? MasterPlanFieldIds { get; set; }
        public int[]? MasterPlanElementIds { get; set; }
        public List<CreateMasterPlanFieldDto>? NewMasterPlanFields { get; set; }
        public Dictionary<int, string>? TempMasterPlanFieldNames { get; set; }
        public string[]? NewMasterPlanElementNames { get; set; }
        public int[]? OrderedMasterPlanFieldIds { get; set; }
        public int[]? OrderedMasterPlanElementIds { get; set; }
    }
}
