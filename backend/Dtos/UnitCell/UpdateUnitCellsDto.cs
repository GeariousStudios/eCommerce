namespace backend.Dtos.UnitCell
{
    public class UpdateUnitCellsDto
    {
        public DateOnly Date { get; set; }
        public int Hour { get; set; }
        public List<UnitCellValueDto> Values { get; set; } = new();
    }
}
