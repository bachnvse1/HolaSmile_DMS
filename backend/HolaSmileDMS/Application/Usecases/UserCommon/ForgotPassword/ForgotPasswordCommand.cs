using MediatR;

namespace HDMS_API.Application.Usecases.Auth.ForgotPassword
{
    public class ForgotPasswordCommand : IRequest<string>
    {
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
        public string ResetPasswordToken { get; set; }
    }
}
