using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.MasterPlan
{
    public class CreateMasterPlanDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }

        public List<CreateMasterPlanFieldDto> Fields { get; set; } = new();
        public List<CreateMasterPlanElementDto> Elements { get; set; } = new();
    }
}
