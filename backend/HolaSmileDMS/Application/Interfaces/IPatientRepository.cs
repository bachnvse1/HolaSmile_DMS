using Application.Usecases.UserCommon.Appointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace HDMS_API.Application.Interfaces
{
    public interface IPatientRepository
    {
        Task<Patient> CreatePatientAsync(CreatePatientDto createPatientDto,int userID);
        Task<Patient> GetPatientByIdAsync(int patientId);
        Task<Patient> GetPatientByUserIdAsync(int userId);
    }
}
