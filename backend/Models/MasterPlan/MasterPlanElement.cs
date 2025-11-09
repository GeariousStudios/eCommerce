using backend.Models.ManyToMany;

namespace backend.Models
{
    public class MasterPlanElement
    {
        public int Id { get; set; }
        public List<MasterPlanElementValue> Values { get; set; } = new();
        public List<MasterPlanToMasterPlanElement> MasterPlanToMasterPlanElements { get; set; } =
            new();

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        // States and properties.
        public int? GroupId { get; set; }
        public bool StruckElement { get; set; }
        public bool CurrentElement { get; set; }
        public bool NextElement { get; set; }
    }
}
