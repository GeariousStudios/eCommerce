namespace backend.Models.ManyToMany
{
    public class UnitToUnitColumn
    {
        public int UnitId { get; set; }
        public Unit Unit { get; set; } = null!;

        public int UnitColumnId { get; set; }
        public UnitColumn UnitColumn { get; set; } = null!;

        public int Order { get; set; }
    }
}
