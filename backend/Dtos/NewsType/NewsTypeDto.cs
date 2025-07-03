namespace backend.Dtos.NewsType
{
    public class NewsTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
