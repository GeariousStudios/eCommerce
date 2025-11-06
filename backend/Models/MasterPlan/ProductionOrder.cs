using System.ComponentModel.DataAnnotations;
using backend.Models.ManyToMany;

namespace backend.Models
{
    public class ProductionOrder
    {
        public int Id { get; set; }

        // Details.
        public string? OrderNumber { get; set; }
        public string? SeqNumber { get; set; }
        public string? ArticleNumber { get; set; }
        public double? Quantity { get; set; }
    }
}
