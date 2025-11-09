using System.ComponentModel.DataAnnotations;

namespace backend.Dtos.Report
{
    public class CreateReportDto
    {
        public int UnitId { get; set; }
        public DateOnly Date { get; set; }
        public int Hour { get; set; }

        [Required(ErrorMessage = "[1|Report/a start time] Validation/Please select")]
        public DateTime StartTime { get; set; }
        public DateTime? StopTime { get; set; }
        public int? CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public string? Content { get; set; }
    }
}
