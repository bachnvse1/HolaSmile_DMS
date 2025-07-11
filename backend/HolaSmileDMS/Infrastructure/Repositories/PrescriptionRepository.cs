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
    public async Task<List<Prescription>> GetByTreatmentRecordIdAsync(int appointmentId, CancellationToken ct = default)
    {
        return await _context.Prescriptions
            .Where(p => p.AppointmentId == appointmentId)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<Prescription?> GetPrescriptionByPrescriptionIdAsync(int preID)
    {
        return await _context.Prescriptions
            .Include(p => p.Appointment)
            .FirstOrDefaultAsync(p => p.PrescriptionId == preID);
    }

    public async Task<Prescription?> GetPrescriptionByAppointmentIdAsync(int appId)
    {
        return await _context.Prescriptions
            .Include(p => p.Appointment)
            .FirstOrDefaultAsync(p => p.AppointmentId == appId);
    }

    public async Task<bool> CreatePrescriptionAsync(Prescription prescription)
    {
         _context.Prescriptions.AddAsync(prescription);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdatePrescriptionAsync(Prescription prescription)
    {
        _context.Prescriptions.Update(prescription);
        return await _context.SaveChangesAsync() > 0;
    }
}