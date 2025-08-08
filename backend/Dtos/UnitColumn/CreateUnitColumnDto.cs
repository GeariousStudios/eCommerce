using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.UnitColumn
{
    public class CreateUnitColumnDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[2|UnitColumn/a data type] Validation/Please select")]
        public UnitColumnDataType DataType { get; set; }
    }
}
