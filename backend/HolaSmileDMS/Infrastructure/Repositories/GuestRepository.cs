using HDMS_API.Application.Common.Helpers;
using HDMS_API.Application.Interfaces;
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
        public async Task<bool> CreateAppointmentAsync(Appointment appointment)
        {
            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<IEnumerable<Schedule>> GetAvailableSlotsAsync(DateOnly date, int doctorId)
        {
            throw new NotImplementedException();
        }
    }
}
