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

    public async Task<bool> CreateAsync(Instruction instruction, CancellationToken ct = default)
    {
        _context.Instructions.Add(instruction);
        var result = await _context.SaveChangesAsync(ct);
        return result > 0;
    }


    public async Task<List<Instruction>> GetByTreatmentRecordIdAsync(int appointmentId, CancellationToken ct = default)
    {
        return await _context.Instructions
            .Where(i => i.AppointmentId == appointmentId)
            .AsNoTracking()
            .ToListAsync(ct);
    }
}