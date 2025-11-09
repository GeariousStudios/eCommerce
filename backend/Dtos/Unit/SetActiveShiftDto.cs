using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.Unit
{
    public class SetActiveShiftDto
    {
        public int ActiveShiftId { get; set; }
        public string Date { get; set; } = "";
        public int Hour { get; set; }
        public int Minute { get; set; }
    }
}
