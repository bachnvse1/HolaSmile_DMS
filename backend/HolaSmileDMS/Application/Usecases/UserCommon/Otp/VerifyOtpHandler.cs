using Application.Constants.Interfaces;
using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class VerifyOtpHandler : IRequestHandler<VerifyOtpCommand, string>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        public VerifyOtpHandler(IUserCommonRepository userCommonRepository)
        {
            _userCommonRepository = userCommonRepository;
        }
        public async Task<string> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
        {
            var resetPasswordToken = await _userCommonRepository.VerifyOtpAsync(request);
            return resetPasswordToken;
        }
    }

}
