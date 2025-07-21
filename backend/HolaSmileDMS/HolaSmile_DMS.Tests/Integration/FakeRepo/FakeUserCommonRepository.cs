using Application.Interfaces;
using Application.Usecases.Administrator.ViewListUser;
using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.UserCommon.ForgotPassword;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Application.Usecases.UserCommon.Otp;
using Application.Usecases.Administrator.ViewListUser;

namespace Infrastructure.Repositories;

// ✅ Thêm class giả trong test
public class FakeUserCommonRepository : IUserCommonRepository
{
    public Task<User> CreatePatientAccountAsync(CreatePatientDto dto, string password)
    {
        throw new NotImplementedException();
    }

    public Task<bool> SendPasswordForGuestAsync(string email)
    {
        throw new NotImplementedException();
    }

    public Task<bool> SendOtpEmailAsync(string toEmail)
    {
        throw new NotImplementedException();
    }

    public Task<bool> ResendOtpAsync(string toEmail)
    {
        throw new NotImplementedException();
    }

    public Task<string> VerifyOtpAsync(VerifyOtpCommand otp)
    {
        throw new NotImplementedException();
    }

    public Task<string> ResetPasswordAsync(ForgotPasswordCommand request)
    {
        throw new NotImplementedException();
    }

    public Task<User?> GetUserByPhoneAsync(string phone)
    {
        throw new NotImplementedException();
    }

    public Task<User?> GetUserByEmailAsync(string email)
    {
        throw new NotImplementedException();
    }

    public Task<User> GetByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        throw new NotImplementedException();
    }

    public Task<bool> EditProfileAsync(User user, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<ViewProfileDto?> GetUserProfileAsync(int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<UserRoleResult?> GetUserRoleAsync(string username, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<User?> GetByIdAsync(int? userId, CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<User?>(new User
        {
            UserID = userId ?? 0,
            Username = "Test User",
            Email = "test@mail.com"
        });
    }

    public Task<List<Patient>> GetAllPatientsAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<List<Receptionist>> GetAllReceptionistAsync()
    {
        throw new NotImplementedException();
    }

    public Task<List<ViewListUserDTO>> GetAllUserAsync()
    {
        throw new NotImplementedException();
    }

    public Task<bool> CreateUserAsync(User user, string role)
    {
        throw new NotImplementedException();
    }

    public Task<int?> GetUserIdByRoleTableIdAsync(string role, int id)
    {
        throw new NotImplementedException();
    }

    public Task<bool> UpdateUserStatusAsync(int userId, int updatedBy)
    {
        throw new NotImplementedException();
    }
    Task<User> IUserCommonRepository.CreatePatientAccountAsync(CreatePatientDto dto, string password)
    {
        throw new NotImplementedException();
    }

    Task<bool> IUserCommonRepository.SendPasswordForGuestAsync(string email)
    {
        throw new NotImplementedException();
    }

    Task<bool> IUserCommonRepository.SendOtpEmailAsync(string toEmail)
    {
        throw new NotImplementedException();
    }

    Task<bool> IUserCommonRepository.ResendOtpAsync(string toEmail)
    {
        throw new NotImplementedException();
    }

    Task<string> IUserCommonRepository.VerifyOtpAsync(VerifyOtpCommand otp)
    {
        throw new NotImplementedException();
    }

    Task<string> IUserCommonRepository.ResetPasswordAsync(ForgotPasswordCommand request)
    {
        throw new NotImplementedException();
    }

    Task<User?> IUserCommonRepository.GetUserByPhoneAsync(string phone)
    {
        throw new NotImplementedException();
    }

    Task<User?> IUserCommonRepository.GetUserByEmailAsync(string email)
    {
        throw new NotImplementedException();
    }

    Task<User> IUserCommonRepository.GetByUsernameAsync(string username, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
    

    Task<bool> IUserCommonRepository.EditProfileAsync(User user, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<ViewProfileDto?> IUserCommonRepository.GetUserProfileAsync(int userId, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    Task<UserRoleResult?> IUserCommonRepository.GetUserRoleAsync(string username, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
    

    Task<List<Receptionist>> IUserCommonRepository.GetAllReceptionistAsync()
    {
        throw new NotImplementedException();
    }

    Task<List<ViewListUserDTO>> IUserCommonRepository.GetAllUserAsync()
    {
        throw new NotImplementedException();
    }

    Task<bool> IUserCommonRepository.CreateUserAsync(User user, string role)
    {
        throw new NotImplementedException();
    }

    Task<int?> IUserCommonRepository.GetUserIdByRoleTableIdAsync(string role, int id)
    {
        throw new NotImplementedException();
    }
}
