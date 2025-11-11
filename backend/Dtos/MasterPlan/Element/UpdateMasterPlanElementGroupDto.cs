namespace backend.Dtos.MasterPlan.Element
{
    // Each element in a group.
    public class UpdateMasterPlanElementGroupDto
    {
        public int ElementId { get; set; }
        public int? GroupId { get; set; }
        public int Order { get; set; }
    }

    // The group of elements.
    public class UpdateMasterPlanElementGroupListDto
    {
        public List<UpdateMasterPlanElementGroupDto> Elements { get; set; } = new();
    }
}
