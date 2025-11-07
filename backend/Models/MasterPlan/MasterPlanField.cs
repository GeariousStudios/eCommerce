using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class MasterPlanField
    {
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;

        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;
    }
}
