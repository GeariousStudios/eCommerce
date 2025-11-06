namespace backend.Models
{
    public class ProductionOrder
    {
        public int Id { get; set; }

        // Details.
        public string? OrderNumber { get; set; }
        public string? SequenceNumber { get; set; }
        public string? MaterialPlanAsm { get; set; } // Material Plan Assembly.
        public string? Material { get; set; }
        public string? MaterialDescription { get; set; }
        public string? DestinationCountry { get; set; }
        public double? OrderQuantity { get; set; }
        public double? QuantityPlan { get; set; }
        public string? OUM { get; set; } // Order Unit of Measure.
        public string? PM { get; set; } // Packing Method.

        public string? Comment { get; set; }
    }
}
