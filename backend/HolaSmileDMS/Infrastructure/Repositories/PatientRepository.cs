using Application.Usecases.UserCommon.Appointment;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
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
        public async Task<bool> CancleAppointmentAsync(int appId, int CancleBy)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.AppointmentId == appId && !a.IsDeleted);
            if (appointment == null)
            {
                return false;
            }
            appointment.Status = "canceled";
            appointment.UpdatedAt = DateTime.Now;
            appointment.UpdatedBy = CancleBy;
            _context.Appointments.Update(appointment);
            var result = await _context.SaveChangesAsync();
            return true;
        }
        public async Task<List<AppointmentDTO>> GetAppointmentsByPatientIdAsync(int patientId)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .Where(a => a.PatientId == patientId && !a.IsDeleted)
                .ToListAsync();
            if (result == null || !result.Any())
            {
                return new List<AppointmentDTO>();
            }
            var appDto = result.Select(result => new AppointmentDTO
            {
                AppointmentId = result.AppointmentId,
                PatientName = result.Patient.User.Fullname,
                DentistName = result.Dentist.User.Fullname,
                Status = result.Status,
                Content = result.Content,
                IsNewPatient = result.IsNewPatient,
                AppointmentType = result.AppointmentType,
                AppointmentDate = result.AppointmentDate,
                AppointmentTime = result.AppointmentTime,
                CreatedAt = result.CreatedAt,
                UpdatedAt = result.UpdatedAt,
                CreatedBy = result.CreatedBy,
                UpdatedBy = result.UpdatedBy,
            }).ToList();
            return appDto;
        }

        public async Task<bool> CheckAppointmentByPatientIdAsync(int appId, int patientId)
        {
            var result = await _context.Appointments.AnyAsync(a => a.AppointmentId == appId && a.PatientId == patientId );
            return result;
        }
    }
}
