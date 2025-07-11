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

    public Task<bool> CreateAsync(Instruction instruction, CancellationToken ct = default)
    {
        throw new NotImplementedException();
    }

    public async Task<List<Instruction>> GetByTreatmentRecordIdAsync(int appointmentId, CancellationToken ct = default)
    {
        return await _context.Instructions
            .Where(i => i.AppointmentId == appointmentId)
            .AsNoTracking()
            .ToListAsync(ct);
    }
}