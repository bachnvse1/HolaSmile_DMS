using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class RequestOtpCommand : IRequest<bool>
    {
        public string Email { get; set; }
    }
}
