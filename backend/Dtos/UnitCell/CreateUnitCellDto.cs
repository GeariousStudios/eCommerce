namespace backend.Dtos.UnitCell
{
    public class CreateUnitCellDto
    {
        public int UnitId { get; set; }
        public int ColumnId { get; set; }
        public int Hour { get; set; }

        public string? Value { get; set; }
        public int? IntValue { get; set; }
        public DateOnly? Date { get; set; }
    }
}
