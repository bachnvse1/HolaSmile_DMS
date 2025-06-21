using MediatR;

namespace Application.Usecases.UserCommon.ViewListPatient
{
    public class ViewListPatientCommand : IRequest<List<ViewListPatientDto>>
    {
    }
}
