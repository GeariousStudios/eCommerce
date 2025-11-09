namespace backend.Models.ManyToMany
{
    public class UnitToStopType
    {
        public int UnitId { get; set; }
        public Unit Unit { get; set; } = null!;

        public int StopTypeId { get; set; }
        public StopType StopType { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
