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

        // Meta data.
        public DateTime CreationDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime UpdateDate { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
