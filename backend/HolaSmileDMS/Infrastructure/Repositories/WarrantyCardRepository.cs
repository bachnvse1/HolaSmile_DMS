using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class WarrantyCardRepository : IWarrantyRepository
    {
        private readonly ApplicationDbContext _context;

        public WarrantyCardRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WarrantyCard?> GetWarrantyCardByPatientIdAsync(int patientId, CancellationToken cancellationToken)
        {
            return await _context.WarrantyCards
                .Include(w => w.Procedure)
                .Include(w => w.TreatmentRecord)
                    .ThenInclude(tr => tr.Appointment)
                        .ThenInclude(app => app.Patient)
                .Include(w => w.TreatmentRecord)
                    .ThenInclude(tr => tr.Dentist)
                        .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(w => w.TreatmentRecord.Appointment.Patient.PatientID == patientId, cancellationToken);
        }


    }
}
