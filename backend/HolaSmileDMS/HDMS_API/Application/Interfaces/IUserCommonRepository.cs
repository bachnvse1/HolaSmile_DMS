using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Otp;

namespace HDMS_API.Application.Interfaces
{
    public interface IUserCommonRepository
    {
        Task<User> CreatePatientAccountAsync(CreatePatientCommand request, string password);
        Task<bool> SendPasswordForGuestAsync(string email);
        Task<bool> SendOtpEmailAsync(string toEmail);
        Task<string> VerifyOtpAsync(VerifyOtpCommand otp);
        Task<string> ResetPasswordAsync(ForgotPasswordCommand request);

    }
}
