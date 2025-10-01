using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class Unit
    {
        public int Id { get; set; }

        [MaxLength(16)]
        public string Name { get; set; } = string.Empty;
        public bool IsHidden { get; set; }
        public int UnitGroupId { get; set; }
        public required UnitGroup UnitGroup { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<UnitToCategory> UnitToCategories { get; set; } = new();
        public List<UnitToUnitColumn> UnitToUnitColumns { get; set; } = new();
        public List<UnitToShift> UnitToShifts { get; set; } = new();
        public List<TrendingPanelToUnit> TrendingPanelToUnits { get; set; } = new();

        public List<UnitCell> UnitCells { get; set; } = new();
        public List<Report> Reports { get; set; } = new();
    }
}
