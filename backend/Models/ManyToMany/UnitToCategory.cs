namespace backend.Models.ManyToMany
{
    public class UnitToCategory
    {
        public int UnitId { get; set; }
        public Unit Unit { get; set; } = null!;

        public int CategoryId { get; set; }
        public Category Category { get; set; } = null!;

        public int Order { get; set; }
    }
}
