using MediatR;

namespace Application.Usecases.Dentist.EditPrescription
{
    public class EditPrescriptionCommand  : IRequest<bool>
    {
        public int PrescriptionId { get; set; }
        public string contents { get; set; }

    }
}
