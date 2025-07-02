using Application.Interfaces;
using Application.Usecases.Dentist.ViewListDentistName;
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
            var dentist = await _context.Dentists.Include(d => d.User).FirstOrDefaultAsync(d => d.DentistId == dentistId);
            if (dentist == null || dentist.User == null)
            {
                throw new Exception("Không tìm thấy thông tin nha sĩ hoặc tài khoản người dùng.");
            }
            return dentist;
        }

        public async Task<List<DentistRecordDto>> GetAllDentistsNameAsync(CancellationToken cancellationToken)
        {
            var dentists = await _context.Dentists
                .Include(d => d.User)
                .Where(d => d.User != null && d.User.Status == true)
                .Select(d => new DentistRecordDto
                {
                    DentistId = d.DentistId,
                    FullName = d.User.Fullname
                })
                .ToListAsync(cancellationToken);

            return dentists;
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
