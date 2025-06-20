using Application.Usecases.UserCommon.Appointment;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Infrastructure.Repositories
{
    public class PatientRepository : IPatientRepository
    {
        private readonly ApplicationDbContext _context;
        public PatientRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Patient> CreatePatientAsync(CreatePatientDto dto,int userID)
        {
            var patient = new Patient
            {
                UserID = userID,
                PatientGroup = dto.PatientGroup,
                UnderlyingConditions = dto.UnderlyingConditions,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy,
            };
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
            return patient;
        }

        public async Task<Patient> GetPatientByIdAsync(int patientId)
        {
            var patient = await _context.Patients.FindAsync(patientId);
            return patient;
        }

        public async Task<Patient> GetPatientByUserIdAsync(int userId)
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserID == userId);
            return patient;
        }

    }
}
