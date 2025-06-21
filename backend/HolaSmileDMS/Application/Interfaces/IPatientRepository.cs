using Application.Usecases.UserCommon.ViewListPatient;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace HDMS_API.Application.Interfaces
{
    public interface IPatientRepository
    {
        Task<Patient> CreatePatientAsync(CreatePatientDto createPatientDto,int userID);
        Task<List<RawPatientDto>> GetAllPatientsAsync(CancellationToken cancellationToken);
    }
}
