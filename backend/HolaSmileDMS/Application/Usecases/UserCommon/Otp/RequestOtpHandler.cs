using Application.Constants.Interfaces;
using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class RequestOtpHandler : IRequestHandler<RequestOtpCommand, bool>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        public RequestOtpHandler(IUserCommonRepository userCommonRepository)
        {
            _userCommonRepository = userCommonRepository;
        }
        public async Task<bool> Handle(RequestOtpCommand request, CancellationToken cancellationToken)
        {
      
            return await _userCommonRepository.SendOtpEmailAsync(request.Email);
        }
    }

}
