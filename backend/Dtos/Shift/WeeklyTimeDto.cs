namespace backend.Dtos.Shift
{
    public class WeeklyTimeDto
    {
        public int TeamId { get; set; }
        public int WeekIndex { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public TimeSpan Start { get; set; }
        public TimeSpan End { get; set; }
    }
}
