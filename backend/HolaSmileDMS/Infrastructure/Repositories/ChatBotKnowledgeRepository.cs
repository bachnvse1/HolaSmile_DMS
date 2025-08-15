using Application.Interfaces;
using Application.Usecases.Guests.AskChatBot;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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

            // 4) Lịch 2 tuần
            var start = DateTime.Today;
            var end = start.AddDays(14);

            var rawSchedules = await _context.Schedules
                .AsNoTracking()
                .Where(s => s.Status == "approved"
                            && s.WorkDate >= start
                            && s.WorkDate < end)
                .Select(s => new
                {
                    DentistId = s.DentistId,
                    DentistName = s.Dentist.User.Fullname,
                    Date = s.WorkDate.Date,   // đặt tên thuộc tính
                    Shift = s.Shift            // dạng "08:00-12:00"
                })
                .OrderBy(x => x.DentistName)
                .ThenBy(x => x.Date)
                .ToListAsync(ct);

            // 5) Gộp ca theo ngày/bác sĩ → map DTO
            var dentistSchedules = rawSchedules
                .GroupBy(x => new { x.DentistName, x.Date })
                .Select(g => new DentistScheduleData
                {
                    DentistName = g.Key.DentistName ?? "",
                    Date = g.Key.Date.ToString("yyyy-MM-dd"),
                    Shift = g.Select(x => x.Shift).Distinct().ToList()
                })
                .ToList();

            // 6) Map vào ClinicDataDto (đặt property là DentistSchedules cho rõ nghĩa)
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

                // Nếu property trong DTO của bạn tên là DentistScheduleData (List) thì gán vào đó.
                // Tôi khuyến nghị đổi tên property thành DentistSchedules (List< Dent istScheduleData >)
                DentistSchedules = dentistSchedules
                // DentistScheduleData = dentistSchedules // dùng dòng này nếu bạn giữ tên cũ
            };
        }

    }
}