namespace backend.Dtos.News
{
    public class CreateNewsDto
    {
        public DateTime Date { get; set; } = DateTime.Today;
        public string Type { get; set; } = string.Empty;
        public string Headline { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
