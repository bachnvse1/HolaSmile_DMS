using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace HDMS_API.Application.Interfaces
{
    public interface IUserCommonRepository
    {
        Task<User> CreatePatientAccountAsync(CreatePatientCommand request, string password);
        Task<bool> SendPasswordForGuestAsync(string email);
    }
}
