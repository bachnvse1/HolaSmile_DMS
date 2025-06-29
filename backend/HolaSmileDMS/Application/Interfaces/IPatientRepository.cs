using Application.Usecases.Patients.ViewListPatient;
using Application.Usecases.UserCommon.ViewAppointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace Application.Interfaces
{
    public interface IPatientRepository
    {
        Task<Patient> CreatePatientAsync(CreatePatientDto createPatientDto, int userID);
        Task<Patient> GetPatientByPatientIdAsync(int? patientId);
        Task<Patient> GetPatientByUserIdAsync(int userId);
        Task<bool> UpdatePatientInforAsync(Patient patient);
        Task<Patient> CheckEmailPatientAsync(string email);
        Task<List<RawPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
        Task<List<ViewListPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
    }
}