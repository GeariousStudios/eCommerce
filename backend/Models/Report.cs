using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Report
    {
        public int Id { get; set; }

        public int UnitId { get; set; }
        public DateOnly Date { get; set; }
        public int Hour { get; set; }

        public int? CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? SubCategoryName { get; set; }
        public string? Content { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? StopTime { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;

        public Unit Unit { get; set; } = null!;
    }
}
