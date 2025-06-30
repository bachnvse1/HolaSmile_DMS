using MediatR;

namespace Application.Usecases.Admintrator.ViewListUser
{
    public class ViewListUserCommand : IRequest<List<ViewListUserDTO>>
    {
        public ViewListUserCommand()
        {
        }
    }

}
