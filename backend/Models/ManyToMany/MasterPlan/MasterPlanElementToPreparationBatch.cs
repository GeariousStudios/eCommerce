using System.ComponentModel.DataAnnotations;

namespace backend.Models.ManyToMany
{
    public class MasterPlanElementToPreparationBatch
    {
        public int Id { get; set; }

        public int MasterPlanElementId { get; set; }
        public MasterPlanElement MasterPlanElement { get; set; } = null!;

        public int PreparationBatchId { get; set; }
        public PreparationBatch PreparationBatch { get; set; } = null!;
    }
}
