namespace backend.Models
{
    public class MasterPlanElement
    {
        public int Id { get; set; }

        public int MasterPlanId { get; set; }
        public MasterPlan MasterPlan { get; set; } = null!;

        public List<MasterPlanElementValue> Values { get; set; } = new();
    }
}
