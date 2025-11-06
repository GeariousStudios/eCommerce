using System.ComponentModel.DataAnnotations;

namespace backend.Models.ManyToMany
{
    public class MasterPlanElementToProductionOrder
    {
        public int Id { get; set; }

        public int MasterPlanElementId { get; set; }
        public MasterPlanElement MasterPlanElement { get; set; } = null!;

        public int ProductionOrderId { get; set; }
        public ProductionOrder ProductionOrder { get; set; } = null!;
    }
}
