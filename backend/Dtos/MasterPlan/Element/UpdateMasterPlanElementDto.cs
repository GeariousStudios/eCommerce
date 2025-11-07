using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class UpdateMasterPlanElementDto
    {
        public List<UpdateMasterPlanElementValueDto> Values { get; set; } = new();
    }
}
