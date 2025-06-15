using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Login
{
    public class LoginCommand : IRequest<LoginResultDto>
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
