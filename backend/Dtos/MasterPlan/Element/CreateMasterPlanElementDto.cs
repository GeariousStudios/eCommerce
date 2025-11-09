namespace backend.Dtos.MasterPlan
{
    public class CreateMasterPlanElementDto
    {
        public List<CreateMasterPlanElementValueDto> Values { get; set; } = new();
        public int? GroupId { get; set; }
        public bool StruckElement { get; set; }
        public bool CurrentElement { get; set; }
        public bool NextElement { get; set; }
        public int? Order { get; set; }
    }
}
