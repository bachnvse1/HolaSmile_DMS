using Application.Interfaces;
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
        public async Task<bool> CreateAppointmentAsync(Appointment appointment)
        {
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Appointment?> GetAllAppointmentAsync(int appointmentId)
        {
            var result = await _context.Appointments
                .Include( a => a.Patient)
                .Include(a => a.Dentist)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId && !a.IsDeleted);
            return result;
        }
        public async Task<List<Appointment>> GetAppointmentsByPatientIdAsync(int userID)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => a.Patient.User.UserID == userID && !a.IsDeleted)
                .ToListAsync();
            return result ?? new List<Appointment>();
        }

        public async Task<List<Appointment>> GetAppointmentsByDentistIdAsync(int userID)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient).ThenInclude(p => p.User)
                .Include(a => a.Dentist).ThenInclude(d => d.User)
                .Where(a => a.Dentist.User.UserID == userID && !a.IsDeleted)
                .ToListAsync();
            return result ?? new List<Appointment>();
        }

        public async Task<List<Appointment>> GetAllAppointmentAsync()
        {
            var result = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .Where(a => !a.IsDeleted)
                .ToListAsync();
            return result ?? new List<Appointment>();
        }
        public async Task<Appointment> GetAppointmentByIdAsync(int appointmentId)
        {
            var result = await _context.Appointments
                .Include(a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);
            return result ;
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
        public async Task<bool> CheckPatientAppointmentByUserIdAsync(int appId, int userId)
        {
            var result = await _context.Appointments.AnyAsync(a => a.AppointmentId == appId && a.Patient.User.UserID == userId);
            return result;
        }
        public async Task<bool> CheckDentistAppointmentByUserIdAsync(int appId, int userId)
        {
            var result = await _context.Appointments.AnyAsync(a => a.AppointmentId == appId && a.Dentist.User.UserID == userId);
            return result;
        }
        public async Task<bool> ExistsAppointmentAsync(int patientId, DateTime date)
        {
            return await _context.Appointments
            .AnyAsync(a => a.PatientId == patientId
                        && a.AppointmentDate.Date == date.Date
                        && a.Status != "canceled");
        }
        public async Task<Appointment?> GetLatestAppointmentByPatientIdAsync(int? patientId)
        {
            return await _context.Appointments
                .OrderByDescending(a => a.AppointmentDate)
                .ThenByDescending(a => a.AppointmentTime)
                .Where(a => a.PatientId == patientId && !a.IsDeleted)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateAppointmentAsync(Appointment appointment)
        {
            _context.Appointments.Update(appointment);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}
