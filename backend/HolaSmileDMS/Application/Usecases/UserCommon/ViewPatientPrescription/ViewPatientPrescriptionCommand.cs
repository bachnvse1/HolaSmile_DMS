using MediatR;

namespace Application.Usecases.UserCommon.ViewPatientPrescription
{
    public class ViewPatientPrescriptionCommand : IRequest<ViewPrescriptionDTO>
    {
        public int PrescriptionId { get; set; }
        public ViewPatientPrescriptionCommand(int prescriptionId)
        {
            PrescriptionId = prescriptionId;
        }
    }
}
