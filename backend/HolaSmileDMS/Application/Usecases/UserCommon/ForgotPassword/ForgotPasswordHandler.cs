using Application.Constants.Interfaces;
using MediatR;

namespace HDMS_API.Application.Usecases.Auth.ForgotPassword
{
    public class ForgotPasswordHandler : IRequestHandler<ForgotPasswordCommand, string>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        public ForgotPasswordHandler(IUserCommonRepository userCommonRepository)
        {
            _userCommonRepository = userCommonRepository;
        }
        public Task<string> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
        {
            var result = _userCommonRepository.ResetPasswordAsync(request);
            return result;
        }
    }
}
