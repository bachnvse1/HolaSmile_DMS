using Application.Interfaces;
using Application.Usecases.Administrator.ViewListUser;
using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewProfile;
using HDMS_API.Application.Usecases.Auth.ForgotPassword;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Application.Usecases.UserCommon.Login;
using HDMS_API.Application.Usecases.UserCommon.Otp;

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

    public Task<User?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return System.Threading.Tasks.Task.FromResult<User?>(new User
        {
            UserID = id,
            Username = "Test User",
            Email = "test@mail.com"
        });
    }

    public Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken)
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

    public Task<bool> UpdateUserStatusAsync(int userId)
    {
        throw new NotImplementedException();
    }

    public Task<int?> GetUserIdByRoleTableIdAsync(string role, int id)
    {
        throw new NotImplementedException();
    }

    public Task<User?> GetByIdAsync(int? userId, CancellationToken cancellationToken)
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

    public Task<bool> UpdateUserStatusAsync(int userId)
    {
        throw new NotImplementedException();
    }
}
