using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Login
{
    public class LoginHandler : IRequestHandler<LoginCommand, LoginResultDto>
    {
        public Task<LoginResultDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            return null;
        }
    }
}
