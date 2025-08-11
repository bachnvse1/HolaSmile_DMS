using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.ChangeEmailOtp
{
    public class VerifyChangeEmailOtpCommand : IRequest<string>
    {
        public string NewEmail { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }
}
