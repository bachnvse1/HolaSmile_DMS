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
        public async Task<PrescriptionTemplate?> GetByIdAsync(int id, CancellationToken cancellationToken)
        {
            return await _context.PrescriptionTemplates
                .FirstOrDefaultAsync(x => x.PreTemplateID == id, cancellationToken);
        }

        public async Task<bool> UpdateAsync(PrescriptionTemplate template, CancellationToken cancellationToken)
        {
            _context.PrescriptionTemplates.Update(template);
            var result = await _context.SaveChangesAsync(cancellationToken);
            return result > 0; 
        }
    }
}
