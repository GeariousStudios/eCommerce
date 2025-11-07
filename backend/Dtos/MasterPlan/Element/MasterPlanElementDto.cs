using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class MasterPlanElementDto
    {
        public int Id { get; set; }
        public List<MasterPlanElementValueDto> Values { get; set; } = new();
    }
}
