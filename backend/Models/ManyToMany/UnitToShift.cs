namespace backend.Models.ManyToMany
{
    public class UnitToShift
    {
        public int UnitId { get; set; }
        public Unit Unit { get; set; } = null!;

        public int ShiftId { get; set; }
        public Shift Shift { get; set; } = null!;

        public bool IsActive { get; set; }
        public int Order { get; set; }
    }
}
