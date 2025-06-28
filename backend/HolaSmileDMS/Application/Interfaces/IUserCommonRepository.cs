using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using Application.Usecases.UserCommon.ViewListPatient;
using HDMS_API.Application.Usecases.UserCommon.Login;

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
        Task<User?> GetUserByEmailAsync(string email);
        public Task<User> GetByUsernameAsync(string username, CancellationToken cancellationToken);
        Task<User?> GetByEmailAsync(string email);
        Task<bool> EditProfileAsync(User user, CancellationToken cancellationToken);
        Task<ViewProfileDto?> GetUserProfileAsync(int userId, CancellationToken cancellationToken);
        Task<UserRoleResult?> GetUserRoleAsync(string username, CancellationToken cancellationToken);
        Task<User?> GetByIdAsync(int userId, CancellationToken cancellationToken);
        Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
        Task<List<Receptionist>> GetAllReceptionistAsync();
    }
}
