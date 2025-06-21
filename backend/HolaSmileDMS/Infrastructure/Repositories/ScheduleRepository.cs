
using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;

namespace Infrastructure.Repositories
{
    public class ScheduleRepository : IScheduleRepository
    {
        private readonly ApplicationDbContext _context;
        public ScheduleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public DateTime GetWeekStart(DateTime date)
        {

            // This method calculates the start of the week (Monday) for a given date.
            int daysToSubtract = (int)date.DayOfWeek - 1;
            if (daysToSubtract < 0) daysToSubtract = 6; // For Sunday
            return date.Date.AddDays(-daysToSubtract);
        }


        public async Task<bool> RegisterScheduleByDentist(Schedule schedule)
        {
            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
