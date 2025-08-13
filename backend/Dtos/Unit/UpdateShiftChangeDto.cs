using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.Unit
{
    public class UpdateShiftChangeDto
    {
        public string? Date { get; set; }
        public int? Hour { get; set; }
        public int? Minute { get; set; }
        public int? NewShiftId { get; set; }
    }
}
