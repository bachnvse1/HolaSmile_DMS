using MediatR;

namespace HDMS_API.Application.Usecases.UserCommon.ChangeEmailOtp
{
    public class RequestChangeEmailOtpCommand : IRequest<bool>
    {
        public string NewEmail { get; set; } = string.Empty;
    }
}
