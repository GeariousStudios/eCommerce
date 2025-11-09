namespace backend.Models
{
    public class News
    {
        public int Id { get; set; }
        public DateTime Date { get; set; } = DateTime.Today;
        public int TypeId { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public string Headline { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        // Meta data.
        public DateTime CreationDate { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
