using Application.Usecases.UserCommon.Appointment;
using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HDMS_API.Infrastructure.Repositories
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly ApplicationDbContext _context;
        public AppointmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int patientId)
        {
            var appointment = new Appointment
            {
                PatientId = patientId,
                DentistId = request.DentistId,
                Status = "confirm",
                Content = request.MedicalIssue,
                IsNewPatient = true,
                AppointmentType = "",
                AppointmentDate = request.AppointmentDate,
                AppointmentTime = request.AppointmentTime,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = patientId,
                IsDeleted = false
            };
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return appointment;
        }

        public async Task<Appointment?> GetAllAppointmentAsync(int appointmentId)
        {
            var result = await _context.Appointments
                .Include( a => a.Patient)
                .Include(a => a.Dentist)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId && !a.IsDeleted);
            return result;
        }
        public async Task<List<AppointmentDTO>> GetAppointmentsByPatientIdAsync(int userID)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => a.Patient.User.UserID == userID && !a.IsDeleted)
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
        public async Task<List<AppointmentDTO>> GetAllAppointmentAsync()
        {
            var result = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .Where(a => !a.IsDeleted)
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
        public async Task<AppointmentDTO> GetAppointmentByIdAsync(int appointmentId)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);
            if (result == null)
            {
                return null;
            }
            var appDto = new AppointmentDTO
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
            };
            return appDto;

        }
        public async Task<bool> CancelAppointmentAsync(int appId, int CancleBy)
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
        public async Task<bool> CheckAppointmentByPatientIdAsync(int appId, int userId)
        {
            var result = await _context.Appointments.AnyAsync(a => a.AppointmentId == appId && a.Patient.User.UserID == userId);
            return result;
        }

        public async Task<bool> ExistsAppointmentAsync(int patientId, DateTime date)
        {

            return await _context.Appointments
            .AnyAsync(a => a.PatientId == patientId
                        && a.AppointmentDate.Date == date.Date
                        && a.Status != "Cancelled");
        }
    }
}
