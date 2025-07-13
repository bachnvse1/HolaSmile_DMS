using MediatR;

namespace Application.Usecases.Dentist.CreatePrescription
{
    public class CreatePrescriptionCommand : IRequest<bool>
    {
        public int AppointmentId { get; set; }
        public string contents { get; set; }
    }
}
