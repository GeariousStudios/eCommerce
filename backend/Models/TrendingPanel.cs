using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class TrendingPanel
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;

        public TrendingTypes? Type { get; set; }
        public TrendingPeriods? Period { get; set; }
        public TrendingViewModes? ViewMode { get; set; }

        public int? UnitColumnId { get; set; }
        public UnitColumn? UnitColumn { get; set; }

        public int? UserId { get; set; }
        public User? User { get; set; }

        public List<TrendingPanelToUnit> TrendingPanelToUnits { get; set; } = new();

        public DateTime? CustomStartDate { get; set; }
        public DateTime? CustomEndDate { get; set; }

        [Range(1, 4)]
        public int ColSpan { get; set; } = 1;

        public int Order { get; set; }

        public bool ShowInfo { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }

    public enum TrendingTypes
    {
        Total,
        Average,
    }

    public enum TrendingPeriods
    {
        AllTime,
        Today,
        Yesterday,
        Weekly,
        Monthly,
        Quarterly,
        Custom,
    }

    public enum TrendingViewModes
    {
        Value,
        LineChart,
        BarChart,
        PieChart,
    }
}
