using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class MasterPlanElement
    {
        public int Id { get; set; }

        // Details.
        public string? FillingBatchNumber { get; set; }
        public DateTime? PlannedStart { get; set; }
        public DateTime? PlannedEnd { get; set; }

        // Relations.
        public List<MasterPlanElementToProductionOrder> MasterPlanElementToProductionOrders { get; set; } =
            new();
        public List<MasterPlanElementToPreparationBatch> MasterPlanElementToPreparationBatches { get; set; } =
            new();
    }
}
