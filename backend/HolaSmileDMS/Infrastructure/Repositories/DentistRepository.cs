using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class DentistRepository : IDentistRepository
    {
        private readonly ApplicationDbContext _context;
        public DentistRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Dentist>> GetAllDentistsAsync()
        {
            throw new NotImplementedException();
        }

        public async Task<Dentist> GetDentistByDentistIdAsync(int dentistId)
        {
            var dentist = await _context.Dentists.FindAsync(dentistId);
            return dentist;
        }

        public async Task<Dentist?> GetDentistByUserIdAsync(int userID)
        {
            var dentist = await _context.Dentists
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userID);
            return dentist;
        }
    }
}
