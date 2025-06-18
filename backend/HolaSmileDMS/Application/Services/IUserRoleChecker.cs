namespace HDMS_API.Application.Interfaces
{
    public interface IUserRoleChecker
    {
        Task<string?> GetUserRoleAsync(string username, CancellationToken cancellationToken);
    }
}
