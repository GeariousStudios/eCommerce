using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class MasterPlanElementDto
    {
        public int Id { get; set; }
        public List<MasterPlanElementValueDto> Values { get; set; } = new();
        public int? GroupId { get; set; }
        public bool StruckElement { get; set; }
        public bool CurrentElement { get; set; }
        public bool NextElement { get; set; }
    }
}
