using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class MasterPlanFieldDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<int> MasterPlanIds { get; set; } = new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
