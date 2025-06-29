using Application.Usecases.UserCommon.ViewListPatient;
using Application.Usecases.UserCommon.ViewAppointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace Application.Interfaces
{
    public interface IPatientRepository
    {
        Task<Patient> CreatePatientAsync(CreatePatientDto createPatientDto, int userID);
        Task<Patient> GetPatientByPatientIdAsync(int? patientId);
        Task<Patient> GetPatientByUserIdAsync(int userId);
        Task<List<RawPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
    }
}