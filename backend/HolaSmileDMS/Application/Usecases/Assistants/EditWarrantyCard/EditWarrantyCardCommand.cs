using MediatR;

namespace Application.Usecases.Assistant.EditWarrantyCard
{
    public class EditWarrantyCardCommand : IRequest<string>
    {
        public int WarrantyCardId { get; set; }

        public int? Duration { get; set; }

        public bool Status { get; set; }
    }
}
