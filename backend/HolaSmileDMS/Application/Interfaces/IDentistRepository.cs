using Application.Usecases.Dentist.ViewListDentistName;

namespace Application.Interfaces
{
    public interface IDentistRepository
    {
        Task<List<Dentist>> GetAllDentistsAsync();
        Task<Dentist> GetDentistByUserIdAsync(int userId);
        Task<Dentist> GetDentistByDentistIdAsync(int? dentistId);
        Task<List<DentistRecordDto>> GetAllDentistsNameAsync(CancellationToken cancellationToken);
    }
}
