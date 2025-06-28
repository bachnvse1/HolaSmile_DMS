using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewAppointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace Application.Interfaces
{
    public interface IPatientRepository
    {
        Task<Patient> CreatePatientAsync(CreatePatientDto createPatientDto, int userID);
        Task<Patient> GetPatientByIdAsync(int patientId);
        Task<Patient> GetPatientByUserIdAsync(int userId);
        Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
    }
}
