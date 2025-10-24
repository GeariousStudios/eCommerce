using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.Dtos.UnitColumn
{
    public class CreateUnitColumnDto
    {
        [Required(ErrorMessage = "[1|Common/a name] Validation/Please enter")]
        [MaxLength(32, ErrorMessage = "[2|Common/Name|32] Validation/cannot exceed")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "[3|UnitColumn/a data type] Validation/Please select")]
        public UnitColumnDataType DataType { get; set; }

        public bool Compare { get; set; }

        [MaxLength(32, ErrorMessage = "[4|UnitColumn/Comparison text|32] Validation/cannot exceed")]
        public string ComparisonText { get; set; } = string.Empty;
        public bool LargeColumn { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Compare && string.IsNullOrWhiteSpace(ComparisonText))
            {
                yield return new ValidationResult(
                    "[5|UnitColumn/a comparison text] Validation/Please enter",
                    new[] { nameof(ComparisonText) }
                );
            }
        }
    }
}
