namespace backend.Dtos.UnitCell
{
    public class UnitCellDto
    {
        public int Id { get; set; }

        public int UnitId { get; set; }
        public int ColumnId { get; set; }
        public string ColumnName { get; set; } = string.Empty;

        public int Hour { get; set; }
        public string? Value { get; set; }
        public int? IntValue { get; set; }
        public DateOnly? Date { get; set; }

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
