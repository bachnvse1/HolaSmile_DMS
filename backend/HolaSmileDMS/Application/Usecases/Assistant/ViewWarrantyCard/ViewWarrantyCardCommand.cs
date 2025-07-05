using MediatR;

namespace Application.Usecases.Assistant.ViewWarrantyCard
{
    public class ViewWarrantyCardCommand : IRequest<ViewWarrantyCardDto>
    {
        public int PatientId { get; set; }

        public ViewWarrantyCardCommand(int patientId)
        {
            PatientId = patientId;
        }
    }
}
