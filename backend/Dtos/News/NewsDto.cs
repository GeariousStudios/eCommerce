namespace backend.Dtos.News
{
    public class NewsDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public int TypeId { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public string Headline { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public int AuthorId { get; set; }
    }
}
