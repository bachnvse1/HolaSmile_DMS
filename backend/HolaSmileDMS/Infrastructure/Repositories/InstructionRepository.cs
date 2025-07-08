using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class InstructionRepository : IInstructionRepository
{
    private readonly ApplicationDbContext _context;

    public InstructionRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    //public async Task<List<Instruction>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default)
    //{
    //    return await _context.Instructions
    //        .Where(i => i.TreatmentRecord_Id == treatmentRecordId)
    //        .AsNoTracking()
    //        .ToListAsync(ct);
    //}
}