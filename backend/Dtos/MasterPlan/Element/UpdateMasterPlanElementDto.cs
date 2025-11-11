using backend.Dtos.MasterPlan.Element;
using backend.Dtos.Unit;

namespace backend.Dtos.MasterPlan
{
    public class UpdateMasterPlanElementDto
    {
        public List<UpdateMasterPlanElementValueDto> Values { get; set; } = new();
        public int? MasterPlanId { get; set; }
        public int? GroupId { get; set; }
        public bool StruckElement { get; set; }
        public bool CurrentElement { get; set; }
        public bool NextElement { get; set; }
        public int? Order { get; set; }

        public UpdateMasterPlanElementGroupListDto? GroupList { get; set; }
    }
}
