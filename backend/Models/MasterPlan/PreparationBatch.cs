namespace backend.Models
{
    public class PreparationBatch
    {
        public int Id { get; set; }

        // Details.
        public string? BatchNumber { get; set; }
        public string? Material { get; set; }
        public string? MaterialDescription { get; set; }
        public double? OrderQuantity { get; set; }
        public string? OUM { get; set; } // Order Unit of Measure.

        public string? Comment { get; set; }
    }
}
