using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IScheduleRepository
    {
        Task<bool> RegisterScheduleByDentist(Schedule schedule);
        DateTime GetWeekStart(DateTime date);
    }
}
