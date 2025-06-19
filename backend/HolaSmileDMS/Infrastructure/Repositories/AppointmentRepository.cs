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

        public async Task<List<AppointmentDTO>> GetAllAppointmentAsync()
        {
            var result = await _context.Appointments
                .Include( a => a.Patient)
                .ThenInclude(p => p.User)
                .Include(a => a.Dentist)
                .ThenInclude(d => d.User)
                .ToListAsync();
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

        public Task<Appointment> GetAppointmentByIdsAsync(int appointmentId)
        {
            throw new NotImplementedException();
        }

        public Task<List<Appointment>> GetAppointmentsByPatientIdAsync(int patientId)
        {
            throw new NotImplementedException();
        }
    }
}
