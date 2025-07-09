using MediatR;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class CreateSupplyCommand : IRequest<bool>
    {
        public string? SupplyName { get; set; }
        public string? Unit { get; set; }
        public int QuantityInStock { get; set; }
        public decimal Price { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
