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

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<MasterPlanToMasterPlanElement> MasterPlanToMasterPlanElements { get; set; } =
            new();
    }
}
