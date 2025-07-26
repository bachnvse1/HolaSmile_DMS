using MediatR;

namespace Application.Usecases.Dentists.DeleteTreatmentProgress
{
    public class DeleteTreatmentProgressCommand : IRequest<bool>
    {
        public int TreatmentProgressId { get; set; }
    }
}