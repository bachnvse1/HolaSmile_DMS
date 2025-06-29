using MediatR;

namespace Application.Usecases.Admintrator
{
    public class ViewListUserCommand : IRequest<List<ViewListUserDTO>>
    {
        public ViewListUserCommand()
        {
        }
    }

}
