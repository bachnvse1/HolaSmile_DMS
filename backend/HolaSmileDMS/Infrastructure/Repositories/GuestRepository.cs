using Application.Constants.Interfaces;
using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace HDMS_API.Infrastructure.Repositories
{
    public class GuestRepository : IGuestRepository
    {
        private readonly ApplicationDbContext _context;
        public GuestRepository(ApplicationDbContext context)
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


        public async Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId)
        {
            throw new NotImplementedException();
        }
    }
}
