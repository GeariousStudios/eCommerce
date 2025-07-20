using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.UnitColumn
{
    public class CreateUnitColumnDto
    {
        [Required(ErrorMessage = "[1] Fyll i namn")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[2] Välj en datatyp")]
        public UnitColumnDataType DataType { get; set; }
    }
}
