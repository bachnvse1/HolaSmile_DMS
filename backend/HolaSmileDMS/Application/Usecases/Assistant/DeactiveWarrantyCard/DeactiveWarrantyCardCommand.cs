using MediatR;

namespace Application.Usecases.Assistant.DeactiveWarrantyCard
{
    public class DeactiveWarrantyCardCommand : IRequest<string>
    {
        public int WarrantyCardId { get; set; }
    }
}