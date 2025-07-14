using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class InstructionTemplateRepository : IInstructionTemplateRepository
    {
        private readonly ApplicationDbContext _context;

        public InstructionTemplateRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InstructionTemplate?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            return await _context.InstructionTemplates
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Instruc_TemplateID == id, ct);
        }
    }
}
