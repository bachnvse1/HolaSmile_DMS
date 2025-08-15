using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Application.Usecases.Guests.AskChatBot;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SQLitePCL;

namespace Infrastructure.Repositories
{
    public class ChatBotKnowledgeRepository : IChatBotKnowledgeRepository
    {
        private readonly ApplicationDbContext _context;
        public ChatBotKnowledgeRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<List<ChatBotKnowledge>> GetAllAsync()
        {
            return await _context.ChatBotKnowledge.ToListAsync();
        }

        public async Task<bool> CreateNewKnownledgeAsync(ChatBotKnowledge knowledge)
        {
            _context.ChatBotKnowledge.Add(knowledge);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<ChatBotKnowledge?> GetByIdAsync(int id)
        {
            return await _context.ChatBotKnowledge.FindAsync(id);
        }

        public async Task<bool> UpdateResponseAsync(ChatBotKnowledge chatBotKnowledge)
        {
            _context.ChatBotKnowledge.Update(chatBotKnowledge);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<ClinicDataDto?> GetClinicDataAsync(CancellationToken ct)
        {
            var procedures = await _context.Procedures
                .AsNoTracking()
                .Where(p => !p.IsDeleted)
                .OrderBy(p => p.Price)
                .Select(p => p.ProcedureName)
                .ToListAsync(ct);

            var promotions = await _context.DiscountPrograms
                .AsNoTracking()
                .Where(p => !p.IsDelete)
                .Select(p => p.DiscountProgramName)
                .ToListAsync(ct);

            // 3) Danh sách bác sĩ
            var dentists = await _context.Dentists
                .AsNoTracking()
                .Include(d => d.User)
                .Where(d => d.User != null && d.User.Status == true)
                .Select(d => new
                {
                    d.DentistId,
                    Fullname = d.User.Fullname
                })
                .OrderBy(d => d.Fullname)
                .ToListAsync(ct);

            //// 4) Lịch 2 tuần
            //var start = DateTime.Today;
            //var end = start.AddDays(14);

            //var morningStart = new TimeSpan(8, 0, 0);
            //var morningEnd = new TimeSpan(11, 0, 0);
            //var afternoonStart = new TimeSpan(14, 0, 0);
            //var afternoonEnd = new TimeSpan(17, 0, 0);
            //var eveningStart = new TimeSpan(17, 0, 0);
            //var eveningEnd = new TimeSpan(20, 0, 0);

            //var apptAggQuery =
            //    from a in _context.Appointments.AsNoTracking()
            //    where a.AppointmentDate >= start && a.AppointmentDate < end
            //    let shift =
            //        (a.AppointmentTime >= morningStart && a.AppointmentTime < morningEnd) ? "morning" :
            //        (a.AppointmentTime >= afternoonStart && a.AppointmentTime < afternoonEnd) ? "afternoon" :
            //        (a.AppointmentTime >= eveningStart && a.AppointmentTime < eveningEnd) ? "evening" : null
            //    where shift != null
            //    group a by new { a.DentistId, Date = a.AppointmentDate.Date, Shift = shift } into g
            //    select new { g.Key.DentistId, g.Key.Date, g.Key.Shift, Count = g.Count() };

            //var schedulesQuery =
            //    from s in _context.Schedules.AsNoTracking()
            //    where s.IsActive && s.Status == "approved"
            //       && s.WorkDate != null
            //       && s.WorkDate >= start && s.WorkDate < end
            //    select new { s.DentistId, DentistName = s.Dentist.User.Fullname, Date = s.WorkDate.Date, s.Shift };

            //var joined =
            //    from s in schedulesQuery
            //    join a in apptAggQuery
            //      on new { s.DentistId, s.Date, s.Shift }
            //      equals new { a.DentistId, a.Date, a.Shift }
            //      into gj
            //    from a in gj.DefaultIfEmpty()
            //    select new { s.DentistId, s.DentistName, s.Date, s.Shift, AppointmentCount = a != null ? a.Count : 0 };

            //var raw = await joined
            //    .OrderBy(x => x.DentistName)
            //    .ThenBy(x => x.Date)
            //    .ThenBy(x => x.Shift)
            //    .ToListAsync(ct);

            //static string MapStatus(int count) => count <= 2 ? "free" : count <= 4 ? "busy" : "full";

            //var dentistSchedules = raw.Select(x => new DentistScheduleData
            //{
            //    DentistName = x.DentistName ?? "",
            //    Date = x.Date.ToString("yyyy-MM-dd"),
            //    Shift = x.Shift,
            //    DentistStatus = MapStatus(x.AppointmentCount)
            //}).ToList();

            var morningStart = new TimeSpan(8, 0, 0);
            var morningEnd = new TimeSpan(11, 0, 0);
            var afternoonStart = new TimeSpan(14, 0, 0);
            var afternoonEnd = new TimeSpan(17, 0, 0);
            var eveningStart = new TimeSpan(17, 0, 0);
            var eveningEnd = new TimeSpan(20, 0, 0);
            var schedules = await _context.Schedules
        .Include(s => s.Dentist)
        .ThenInclude(d => d.User)
        .Include(s => s.Dentist.Appointments)
        .Where(s => s.IsActive && s.Status == "approved" && s.Dentist.User.Status == true).Select(s => new
        {
            s.ScheduleId,
            s.DentistId,
            DentistName = s.Dentist.User.Fullname,
            s.WorkDate,
            s.Shift,
            s.Status,
            s.CreatedAt,
            s.UpdatedAt,
            // Đếm số app theo ca
            AppointmentCount = s.Dentist.Appointments.Count(a =>
                a.AppointmentDate == s.WorkDate.Date &&
                (
                    (s.Shift == "morning" && a.AppointmentTime >= morningStart && a.AppointmentTime < morningEnd) ||
                    (s.Shift == "afternoon" && a.AppointmentTime >= afternoonStart && a.AppointmentTime < afternoonEnd) ||
                    (s.Shift == "evening" && a.AppointmentTime >= eveningStart && a.AppointmentTime < eveningEnd)
                )
            // Nếu cần lọc trạng thái appointment thì thêm điều kiện tại đây, ví dụ:
            // && a.Status == "approved"
        )
        })
    .ToListAsync(ct);
            // 5) Nhóm theo DentistId và map vào DentistScheduleData
            string ToWorkload(int c) => c <= 2 ? "free" : (c <= 4 ? "busy" : "full");


            var dentistSchedules = schedules // Replace 'raw' with 'schedules', which is the correct enumerable object
                .Where(s => s.WorkDate.Date > DateTime.Today) // chỉ các lịch sau hôm nay (không tính hôm nay)
                .GroupBy(x => new { x.DentistId, x.DentistName })
                .Select(g => new DentistScheduleData
                {
                    DentistName = g.Key.DentistName,
                    Schedules = g.Select(s => new ScheduleDTO
                    {
                        ScheduleId = s.ScheduleId,
                        WorkDate = s.WorkDate,
                        Shift = s.Shift,         // morning/afternoon/evening
                        Status = s.Status,
                        Workload = ToWorkload(s.AppointmentCount) // free | busy | full
                    }).ToList()
                })
                .ToList();

            // 4) Map vào ClinicDataDto (đặt property là DentistSchedules cho rõ nghĩa)
            return new ClinicDataDto
            {
                Clinic_Info = new ClinicDataDto.ClinicInfo
                {
                    Name = "Hola Smile",
                    Address = "36 Thạch Hòa, Thạch Thất, Hà Nội",
                    Opening_Hours = "8h–20h các ngày trong tuần"
                },
                Procedures = procedures,
                Contacts = new ClinicDataDto.Contact
                {
                    Phone = "0993133593",
                    Zalo = "0993133593",
                    Email = "phucz2103@gmail.com"
                },
                Promotions = promotions,
                DentistName = dentists.Select(d => d.Fullname ?? "").Distinct().ToList(),

                DentistSchedules = dentistSchedules
            };
        }

    }
}