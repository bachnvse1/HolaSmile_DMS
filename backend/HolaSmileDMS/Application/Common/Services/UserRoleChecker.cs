/*using HDMS_API.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Application.Common.Services
{
    public class UserRoleChecker : IUserRoleChecker
    {
        private readonly ApplicationDbContext _context;

        public UserRoleChecker(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<string?> GetUserRoleAsync(string username)
        {
            var sql = @"
    SELECT 'Administrator' as Role FROM Administrators WHERE Username = {0}
    UNION ALL
    SELECT 'Assistant' FROM Assistants WHERE Username = {0}
    UNION ALL
    SELECT 'Dentist' FROM Dentists WHERE Username = {0}
    UNION ALL
    SELECT 'Owner' FROM Owners WHERE Username = {0}
    UNION ALL
    SELECT 'Patient' FROM Patients WHERE Username = {0}
    UNION ALL
    SELECT 'Receptionist' FROM Receptionists WHERE Username = {0}
    LIMIT 1
";


            var result = await _context.Set<UserRoleResult>()
                .FromSqlRaw(sql, username)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            return result?.Role;
        }
    }
    public class UserRoleResult
    {
        public string Role { get; set; }
    }
}
*/