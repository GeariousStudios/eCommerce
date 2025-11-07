namespace backend.Dtos.MasterPlan
{
    public class CreateMasterPlanElementDto
    {
        public List<CreateMasterPlanElementValueDto> Values { get; set; } = new();
    }
}
