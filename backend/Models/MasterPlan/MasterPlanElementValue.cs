namespace backend.Models
{
    public class MasterPlanElementValue
    {
        public int Id { get; set; }

        public int MasterPlanElementId { get; set; }
        public MasterPlanElement MasterPlanElement { get; set; } = null!;

        public int MasterPlanFieldId { get; set; }
        public MasterPlanField MasterPlanField { get; set; } = null!;

        public string? Value { get; set; }
    }
}
