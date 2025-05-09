using backend.Models;

namespace backend.Interfaces
{
    public interface IProductService
    {
        IEnumerable<Product> GetAll();
    }
}
