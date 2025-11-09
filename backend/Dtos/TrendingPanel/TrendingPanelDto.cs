using backend.Models;

namespace backend.Dtos.TrendingPanel
{
    public class TrendingPanelDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public TrendingTypes? Type { get; set; }
        public TrendingPeriods? Period { get; set; }
        public TrendingViewModes? ViewMode { get; set; }

        public List<int>? UnitIds { get; set; }

        public int? UnitColumnId { get; set; }
        public string? UnitColumnName { get; set; }

        public DateTime? CustomStartDate { get; set; }
        public DateTime? CustomEndDate { get; set; }

        public int ColSpan { get; set; }

        // If true, this panel is visible to all users.
        public bool IsGlobal { get; set; }

        public int Order { get; set; }
        public bool ShowInfo { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
