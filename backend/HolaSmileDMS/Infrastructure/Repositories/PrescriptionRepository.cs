using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly ApplicationDbContext _context;

    public PrescriptionRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<List<Prescription>> GetByTreatmentRecordIdAsync(int treatmentRecordId, CancellationToken ct = default)
    {
        return await _context.Prescriptions
            .Where(p => p.TreatmentRecord_Id == treatmentRecordId)
            .AsNoTracking()
            .ToListAsync(ct);
    }
}