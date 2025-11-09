namespace backend.Models.ManyToMany
{
    public class MasterPlanToMasterPlanElement
    {
        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;

        public int MasterPlanElementId { get; set; }
        public MasterPlanElement MasterPlanElement { get; set; } = null!;

        public int Order { get; set; }
    }
}
