namespace backend.Models.ManyToMany
{
    public class TrendingPanelToUnit
    {
        public int TrendingPanelId { get; set; }
        public TrendingPanel TrendingPanel { get; set; } = null!;

        public int UnitId { get; set; }
        public Unit Unit { get; set; } = null!;

        public int Order { get; set; }
    }
}
