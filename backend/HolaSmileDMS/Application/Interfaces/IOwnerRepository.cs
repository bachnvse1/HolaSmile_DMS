namespace Application.Interfaces
{
    public interface IOwnerRepository
    {
        Task<List<Owner>> GetAllOwnersAsync();
        Task<Owner> GetOwnerByUserIdAsync(int? userId);
    }
}
