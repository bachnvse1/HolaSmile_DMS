using HDMS_API.Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;
using MySqlConnector;

namespace HDMS_API.Application.Common.Services
{
    public class UserRoleChecker : IUserRoleChecker
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserCommonRepository _userCommonRepository;

        public UserRoleChecker(ApplicationDbContext context, IUserCommonRepository userCommonRepository)
        {
            _context = context;
            _userCommonRepository = userCommonRepository;
        }

        public async Task<string?> GetUserRoleAsync(string username, CancellationToken cancellationToken)
        {
            var userExist = await _userCommonRepository.GetByUsernameAsync(username, cancellationToken);
            if (userExist == null) return null;

            var result = await _context.Set<UserRoleResult>()
                .FromSqlInterpolated($@"
                    SELECT 'Administrator' as Role FROM Administrators WHERE UserId = {userExist.UserID}
                    UNION ALL
                    SELECT 'Assistant' FROM Assistants WHERE UserId = {userExist.UserID}
                    UNION ALL
                    SELECT 'Dentist' FROM Dentists WHERE UserId = {userExist.UserID}
                    UNION ALL
                    SELECT 'Owner' FROM Owners WHERE UserId = {userExist.UserID}
                    UNION ALL
                    SELECT 'Patient' FROM Patients WHERE UserId = {userExist.UserID}
                    UNION ALL
                    SELECT 'Receptionist' FROM Receptionists WHERE UserId = {userExist.UserID}
                    LIMIT 1
                ")
                .AsNoTracking()
                .FirstOrDefaultAsync(cancellationToken);

            return result?.Role;
        }
    }
        public class UserRoleResult
    {
        public string Role { get; set; }
    }
}
