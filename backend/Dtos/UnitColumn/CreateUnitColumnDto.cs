using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.UnitColumn
{
    public class CreateUnitColumnDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|UnitColumn/a data type] Validation/Please select")]
        public UnitColumnDataType DataType { get; set; }
    }
}
