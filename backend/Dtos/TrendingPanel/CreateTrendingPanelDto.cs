using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.TrendingPanel
{
    public class CreateTrendingPanelDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        public TrendingTypes? Type { get; set; }
        public TrendingPeriods? Period { get; set; }
        public TrendingViewModes? ViewMode { get; set; }

        public List<int> UnitIds { get; set; } = new();

        public int? UnitColumnId { get; set; }
        public string? UnitColumnName { get; set; }

        public DateTime? CustomStartDate { get; set; }
        public DateTime? CustomEndDate { get; set; }

        [Range(1, 4)]
        public int ColSpan { get; set; } = 1;

        public bool ShowInfo { get; set; }

        // If true, this panel is visible to all users.
        public bool IsGlobal { get; set; } = false;
    }
}
