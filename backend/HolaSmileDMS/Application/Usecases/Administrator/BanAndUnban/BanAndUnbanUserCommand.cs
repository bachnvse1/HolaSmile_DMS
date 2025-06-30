using MediatR;

namespace Application.Usecases.Administrator.BanAndUnban
{
    public class BanAndUnbanUserCommand : IRequest<bool>
    {
        public int UserId { get; set; }
    }
}
