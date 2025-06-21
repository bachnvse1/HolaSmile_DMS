using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Usecases.Dentist.ManageSchedule;
using Application.Usecases.Dentist.ViewDentistSchedule;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class DentistRepository : IDentistRepository
    {
        private readonly ApplicationDbContext _context;
        public DentistRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateScheduleAsync(Schedule schedule)
        {
            _context.Schedules.Add(schedule);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Dentist>> GetAllDentistsAsync()
        {
            throw new NotImplementedException();
        }


        public async Task<List<DentistScheduleDTO>> GetAllDentistScheduleAsync()
        {
            var availableSechedule = await _context.Dentists.Include(ds => ds.User)
                .Select(ds => new DentistScheduleDTO {
                    DentistID = ds.DentistId,
                    DentistName = ds.User.Fullname,
                    Avatar = ds.User.Avatar,
                    schedules = ds.Schedules
                    .Select(s => new ScheduleDTO
                    {
                        ScheduleId = s.ScheduleId,
                        WorkDate = s.WorkDate,
                        Shift = s.Shift,
                        Status = s.Status
                    }).ToList(),

                    IsAvailable = _context.Appointments.Count(a => a.DentistId == ds.DentistId ) < 5 ? true : false
                }).ToListAsync();
            return availableSechedule;
        }

        public async Task<Dentist?> GetDentistByIdAsync(int userID)
        {
            var dentist = await _context.Dentists
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DentistId == userID);
            return dentist;
        }
    }
}
