using MediatR;

namespace Application.Usecases.Patients.ViewListPatient
{
    public class ViewListPatientCommand : IRequest<List<ViewListPatientDto>>
    {
    }
}
