using MediatR;

namespace Application.Usecases.Assistant.CreateWarrantyCard
{
    public class CreateWarrantyCardCommand : IRequest<CreateWarrantyCardDto>
    {
        public int TreatmentRecordId { get; set; }
        public int Duration { get; set; }
    }
}
