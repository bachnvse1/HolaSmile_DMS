namespace Application.Interfaces
{
    public interface IDentistRepository
    {
        Task<List<Dentist>> GetAllDentistsAsync();
        Task<Dentist> GetDentistByUserIdAsync(int userId);
        Task<Dentist> GetDentistByDentistIdAsync(int dentistId);


    }
}
