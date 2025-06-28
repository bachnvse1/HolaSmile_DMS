using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using Application.Usecases.Patients.ViewListPatient;

namespace Application.Interfaces
{
    public interface IUserCommonRepository
    {
        Task<User> CreatePatientAccountAsync(CreatePatientDto dto, string password);
        Task<bool> SendPasswordForGuestAsync(string email);
        Task<bool> SendOtpEmailAsync(string toEmail);
        Task<bool> ResendOtpAsync(string toEmail);
        Task<string> VerifyOtpAsync(VerifyOtpCommand otp);
        Task<string> ResetPasswordAsync(ForgotPasswordCommand request);
        Task<User?> GetUserByPhoneAsync(string phone);
        public Task<User> GetByUsernameAsync(string username, CancellationToken cancellationToken);
        Task<User?> GetByEmailAsync(string email);
        Task<bool> EditProfileAsync(User user, CancellationToken cancellationToken);
        Task<ViewProfileDto?> GetUserProfileAsync(int userId, CancellationToken cancellationToken);
        Task<string?> GetUserRoleAsync(string username, CancellationToken cancellationToken);
        Task<User?> GetByIdAsync(int userId, CancellationToken cancellationToken);
        Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
    }
}
