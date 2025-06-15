using HDMS_API.Application.Interfaces;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using HDMS_API.Infrastructure.Persistence;

namespace HDMS_API.Infrastructure.Repositories
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly ApplicationDbContext _context;
        public AppointmentRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Appointment> CreateAppointmentAsync(BookAppointmentCommand request, int? patientId)
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
    }
}
