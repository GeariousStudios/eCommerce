using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class MasterPlanElementValueDto
    {
        public int Id { get; set; }
        public int MasterPlanFieldId { get; set; }
        public string? MasterPlanFieldName { get; set; }
        public string? Value { get; set; }
    }
}
