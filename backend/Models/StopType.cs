using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class StopType
    {
        public int Id { get; set; }

        [MaxLength(32)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(7)]
        public string LightColorHex { get; set; } = "#212121";

        [MaxLength(7)]
        public string DarkColorHex { get; set; } = "#e0e0e0";
        public bool IsHidden { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public List<UnitToStopType> UnitToStopTypes { get; set; } = new();
    }
}
