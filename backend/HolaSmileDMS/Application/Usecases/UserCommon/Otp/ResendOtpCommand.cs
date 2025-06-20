
using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class ResendOtpCommand : IRequest<bool>
    {
        public string email { get; set; }
    }
}
