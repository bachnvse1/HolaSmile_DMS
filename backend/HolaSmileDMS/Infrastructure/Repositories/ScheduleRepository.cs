using Application.Interfaces;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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

        public async Task<List<Schedule>> GetAllDentistSchedulesAsync()
        {
            var result = await _context.Schedules
                .Include(s => s.Dentist)
                .ThenInclude(d => d.User)
                .Include(s => s.Dentist.Appointments)
                .Where(s => s.IsActive) // Only get active schedules
                .ToListAsync();
            return result;
        }

        public async Task<List<Schedule>> GetDentistSchedulesByDentistIdAsync(int dentistId)
        {
            var result = await _context.Schedules
                .Include(s => s.Dentist)
                .ThenInclude(d => d.User)
                .Include(s => s.Dentist.Appointments)
                .Where(s => s.Dentist.DentistId == dentistId && s.IsActive)
                .ToListAsync();
            return result;
        }

        public async Task<List<Schedule>> GetDentistApprovedSchedulesByDentistIdAsync(int dentistId)
        {
            var result = await _context.Schedules
                .Include(s => s.Dentist)
                .ThenInclude(d => d.User)
                .Include(s => s.Dentist.Appointments)
                .Where(s => s.Dentist.DentistId == dentistId && s.Status == "approved" && s.IsActive)
                .ToListAsync();
            return result;
        }

        public async Task<Schedule> GetScheduleByIdAsync(int scheduleId)
        {
            var result = await _context.Schedules
                .Include(s => s.Dentist)
                .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(s => s.ScheduleId == scheduleId);
            return result;
        }

        public async Task<bool> UpdateScheduleAsync(Schedule schedule)
        {
            var existingSchedule = _context.Schedules
                .FirstOrDefault(s => s.ScheduleId == schedule.ScheduleId);
            existingSchedule.WorkDate = schedule.WorkDate;
            existingSchedule.Shift = schedule.Shift;
            existingSchedule.UpdatedAt = DateTime.Now;
            _context.Schedules.Update(existingSchedule);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Schedule> CheckDulplicateScheduleAsync(int dentistId, DateTime workDate, string shift, int currentScheduleId)
        {
            var schedule = await _context.Schedules.FirstOrDefaultAsync(s =>
                s.DentistId == dentistId &&
                s.WorkDate.Date == workDate.Date &&
                s.Shift == shift &&
                s.IsActive &&
                s.ScheduleId != currentScheduleId
            );
            return schedule;
        }

        public async Task<bool> DeleteSchedule(int scheduleId, int updateBy)
        {
           var schedule = await _context.Schedules.FindAsync(scheduleId);
            if (schedule == null)
            {
                return false; 
            }
            schedule.IsActive = false;
            schedule.UpdatedAt = DateTime.Now;
            schedule.UpdatedBy = updateBy;
            _context.Schedules.Update(schedule);
            return await _context.SaveChangesAsync() >0; 
        }

        public async Task<List<Schedule>> GetAllAvailableDentistSchedulesAsync(int maxPerSlot)
        {
            var morningStart = new TimeSpan(8, 0, 0);
            var afternoonStart = new TimeSpan(14, 0, 0);
            var eveningStart = new TimeSpan(17, 0, 0);

            var now = DateTime.Now; // hoặc DateTime.UtcNow và lưu/truy vấn đồng nhất theo UTC

            var result = await _context.Schedules
                .Include(s => s.Dentist).ThenInclude(d => d.User)
                .Include(s => s.Dentist.Appointments)
                .OrderBy(s => s.WorkDate)
                .Where(s =>
                    s.IsActive &&
                    s.Status == "approved" &&
                    s.Dentist.User.Status == true &&
                    s.WorkDate.Date.AddHours(3) >= now.Date &&
                    // // số lịch của đúng bác sĩ, đúng NGÀY, đúng ca < 5
                    s.Dentist.Appointments.Count(a =>
                        a.DentistId == s.DentistId &&
                        a.AppointmentDate.Date == s.WorkDate.Date &&
                        // chỉ tính các trạng thái chiếm slot
                        ( a.Status == "confirmed") &&
                        // nửa-kín: start <= t < end
                        (
                            (s.Shift == "morning" && a.AppointmentTime == morningStart) ||
                            (s.Shift == "afternoon" && a.AppointmentTime == afternoonStart) ||
                            (s.Shift == "evening" && a.AppointmentTime == eveningStart )
                        )
                    ) < maxPerSlot
                )
                .ToListAsync();

            return result;
        }

    }
}
