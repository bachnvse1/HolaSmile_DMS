using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.Otp
{
    public class VerifyOtpCommand : IRequest<bool>
    {
        public string Email { get; set; }
        public string Otp { get; set; }
        public DateTime ExpiryTime { get; set; }

    }

}
