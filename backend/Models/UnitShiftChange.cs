using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class UnitShiftChange
    {
        public int Id { get; set; }
        public int UnitId { get; set; }
        public int OldShiftId { get; set; }
        public int NewShiftId { get; set; }
        public DateTime EffectiveFromUtc { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
