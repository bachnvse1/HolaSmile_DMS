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
                Status = "pending",
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

        public Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int? patientId)
        {
            throw new NotImplementedException();
        }

        public async Task<Appointment?> GetAllAppointmentAsync(int appointmentId)
        {
            var result = await _context.Appointments
                .Include( a => a.Patient)
                .Include(a => a.Dentist)
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId && !a.IsDeleted);
            return result;
        }

        public Task<List<Appointment>> GetAllAppointmentAsync()
        {
            throw new NotImplementedException();
        }

        public Task<Appointment> GetAppointmentByIdsAsync()
        {
            throw new NotImplementedException();
        }

        public Task<List<Appointment>> GetAppointmentsByPatientIdAsync(int patientId)
        {
            throw new NotImplementedException();
        }
    }
}
