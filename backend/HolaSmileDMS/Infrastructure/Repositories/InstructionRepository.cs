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
    public async Task<List<Instruction>> GetByTreatmentRecordIdAsync(int appointmentId, CancellationToken ct = default)
    {
        return await _context.Instructions
            .Where(i => i.AppointmentId == appointmentId)
            .AsNoTracking()
            .ToListAsync(ct);
    }
    public async Task<List<Instruction>> GetInstructionsByAppointmentIdAsync(int appointmentId)
    {
        return await _context.Instructions
            .Include(i => i.InstructionTemplate)
            .Where(i => i.AppointmentId == appointmentId && !i.IsDeleted)
            .ToListAsync();
    }
}