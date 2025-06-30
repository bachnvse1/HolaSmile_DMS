using MediatR;

namespace Application.Usecases.Administrator.ViewListUser
{
    public class ViewListUserCommand : IRequest<List<ViewListUserDTO>>
    {
        public ViewListUserCommand()
        {
        }
    }

}
