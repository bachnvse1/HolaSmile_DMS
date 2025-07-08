using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PrescriptionTemplateRepository : IPrescriptionTemplateRepository
    {
        private readonly ApplicationDbContext _context;

        public PrescriptionTemplateRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<PrescriptionTemplate>> GetAllAsync(CancellationToken cancellationToken)
        {
            return await _context.PrescriptionTemplates
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync(cancellationToken);
        }
    }
}
