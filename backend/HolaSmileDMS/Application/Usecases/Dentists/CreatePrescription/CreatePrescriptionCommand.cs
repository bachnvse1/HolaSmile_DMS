using MediatR;

namespace Application.Usecases.Dentists.CreatePrescription
{
    public class CreatePrescriptionCommand : IRequest<bool>
    {
        public int AppointmentId { get; set; }
        public string contents { get; set; }
    }
}
