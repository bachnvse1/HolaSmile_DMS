using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Constants.Interfaces
{
    public interface IScheduleRepository
    {
        Task<bool> RegisterScheduleByDentist(Schedule schedule);
        DateTime GetWeekStart(DateTime date);
        Task<List<Schedule>> GetAllDentistSchedulesAsync();
        Task<List<Schedule>> GetDentistSchedulesByDentistIdAsync(int dentistId);
        Task<Schedule> GetScheduleByIdAsync(int scheduleId);
        Task<bool> UpdateScheduleAsync(Schedule schedule);
        Task<bool> CheckDulplicateScheduleAsync(int dentistId, DateTime workDate, string shift, int currentScheduleId);
        Task<bool> DeleteSchedule(int scheduleId);
    }
}
