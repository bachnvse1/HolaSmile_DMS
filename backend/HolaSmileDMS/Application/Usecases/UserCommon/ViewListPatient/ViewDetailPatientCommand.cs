using MediatR;

namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewDetailPatientCommand : IRequest<ViewDetailPatientDto>
    {
        public int PatientId { get; set; }
    }
}
