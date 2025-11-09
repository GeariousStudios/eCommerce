namespace backend.Models.ManyToMany
{
    public class MasterPlanToMasterPlanField
    {
        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;

        public int MasterPlanFieldId { get; set; }
        public MasterPlanField MasterPlanField { get; set; } = null!;

        public int Order { get; set; }
    }
}
