using Application.Interfaces;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Application.Usecases.Guests.AskChatBot;
using Application.Usecases.UserCommon.ChatbotUserData;
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
                .GroupBy(x => new { x.DentistId, x.DentistName })
                .Select(g => new DentistScheduleData
                {
                    DentistName = g.Key.DentistName,
                    Schedules = g
                    .OrderByDescending(s => s.WorkDate) // 👈 sắp xếp theo ngày
                    .ThenBy(s => s.Shift == "morning" ? 0 : s.Shift == "afternoon" ? 1 : 2)
                    .Select(s => new ScheduleDTO
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
        public async Task<UserCommonDataDto?> GetUserCommonDataAsync(CancellationToken ct)
        {
            // 1) Lấy danh sách lịch hẹn của người dùng
            var appointments = await _context.Appointments
                  .Include(a => a.Patient).ThenInclude(p => p.User)
                  .Include(a => a.Dentist).ThenInclude(d => d.User)
                  .OrderBy(a => a.AppointmentId)
                  .ToListAsync();

            var appIds = appointments.Select(a => a.AppointmentId).ToList();

            // Dùng dictionary để truy nhanh theo AppointmentId
            var prescriptionDict = await _context.Prescriptions
               .Where(p => p.AppointmentId != null && appIds.Contains(p.AppointmentId.Value))
               .ToDictionaryAsync(p => p.AppointmentId!.Value);

            var instructionDict = await _context.Instructions
                .Where(i => i.AppointmentId != null && appIds.Contains(i.AppointmentId.Value))
                .ToDictionaryAsync(i => i.AppointmentId!.Value);


            var resultApp = appointments.Select(app =>
            {
                prescriptionDict.TryGetValue(app.AppointmentId, out var pres);
                instructionDict.TryGetValue(app.AppointmentId, out var inst);

                return new AppointmentData
                {
                    AppointmentId = app.AppointmentId,
                    PatientName = app.Patient.User.Fullname,
                    DentistName = app.Dentist.User.Fullname,
                    AppointmentDate = app.AppointmentDate,
                    appointmentTime = app.AppointmentTime.ToString(@"hh\:mm"),
                    AppointmentType = app.AppointmentType,
                    IsNewPatient = app.IsNewPatient,
                    Status = app.Status,
                    isExistPrescription = pres != null,
                    isExistInstructions = inst != null,
                    PrescriptionDetails = pres != null ? pres.Content : "không có đơn thuốc",
                    InstructionsDetails = inst != null ? inst.Content : "không có đơn thuốc"
                };
            }).ToList();

            // 2) Lấy danh sách supplies
            var supplies = await _context.Supplies
                .Where(s => !s.IsDeleted)
                .Select(s => new Supplies
                {
                    SupplyId = s.SupplyId,
                    Name = s.Name,
                    QuantityInStock = s.QuantityInStock,
                    ExpiryDate = s.ExpiryDate,
                    Price = s.Price,
                })  .ToListAsync(ct);

            // 3) Lấy danh sách procedures
            var procedures = await _context.Procedures
                .Where(p => !p.IsDeleted)
                .Select(p => new ProcedureData
                {
                    ProcedureId = p.ProcedureId,
                    ProcedureName = p.ProcedureName,
                    Price = p.Price,
                    Description = p.Description,
                    OriginalPrice = p.OriginalPrice,
                    ConsumableCost = p.ConsumableCost
                })
                .ToListAsync(ct);

            // 4) Lấy danh sách lịch làm việc của bác sĩ
            var dentistSchedules = await _context.Schedules
     .AsNoTracking()
     .Where(s => s.IsActive
              && s.Status == "approved"
              && s.Dentist.User.Status == true
              && s.WorkDate > DateTime.Now)
     .GroupBy(s => new { s.DentistId, s.Dentist.User.Fullname })
     .Select(g => new DentistScheduleDTO
     {
         DentistID = g.Key.DentistId,
         DentistName = g.Key.Fullname,
         Schedules = g
             .Select(s => new ScheduleDTO
             {
                 ScheduleId = s.ScheduleId,
                 WorkDate = s.WorkDate,
                 Shift = s.Shift, // morning/afternoon/evening
                 Status = s.Status,
                 Workload = s.Dentist.Appointments.Count <= 2 ? "free"
                            : s.Dentist.Appointments.Count <= 4 ? "busy" : "full"
             })
             .OrderBy(x => x.WorkDate)
             .ThenBy(x => x.Shift == "morning" ? 0 : x.Shift == "afternoon" ? 1 : 2)
             .ToList()
     })
     .ToListAsync(ct);


            return new UserCommonDataDto
            {
                Scope  = "Dữ liệu chung của toàn bộ lịch hẹn, vật tư, thủ thuật lịch làm việc của bác sĩ",
                Appointments = resultApp,
                Supplies = supplies,
                Procedures = procedures,
                DentistSchedules = dentistSchedules
            };
        }
        public async Task<OwnerData> GetOwnerData(CancellationToken ct)
        {
            // 1) Lấy danh sách lịch làm việc của bác sĩ
            var dentistSchedules = await _context.Schedules
                .AsNoTracking()
                .Where(s => s.IsActive && s.Status == "approved" && s.Dentist.User.Status == true)
                .OrderByDescending(s => s.WorkDate)
                .GroupBy(s => new { s.DentistId, s.Dentist.User.Fullname })
                .Select(g => new DentistScheduleDTO
                {
                    DentistID = g.Key.DentistId,
                    DentistName = g.Key.Fullname,
                    Schedules = g.Select(s => new ScheduleDTO
                    {
                        ScheduleId = s.ScheduleId,
                        WorkDate = s.WorkDate,
                        Shift = s.Shift, // morning/afternoon/evening
                        Status = s.Status,
                        Workload = s.Dentist.Appointments.Count <= 2 ? "free"
                            : s.Dentist.Appointments.Count <= 4 ? "busy" : "full"
                    }).ToList()
                })
                .ToListAsync(ct);
            // 2) Lấy danh sách nhân viên
            var dentistUsers = _context.Users
            .Join(_context.Dentists,
             u => u.UserID,
             d => d.UserId,
            (u, d) => new EmployeeData
            {
                UserId = u.UserID,
                Email = u.Email,
                Fullname = u.Fullname,
                Phone = u.Phone,
                Role = "Nha sĩ",
                Status = u.Status == true ? "active" : "inactive" // Status = false là bị khoá
            });

            var patientUsers = _context.Users
            .Join(_context.Patients,
             u => u.UserID,
             p => p.UserID,
            (u, d) => new EmployeeData
            {
                UserId = u.UserID,
                Email = u.Email,
                Fullname = u.Fullname,
                Phone = u.Phone,
                Role = "Bệnh nhân",
                Status = u.Status == true ? "hoạt động" : "bị khóa" // Status = false là bị khoá
            });

            var receptionistUsers = _context.Users
                .Join(_context.Receptionists,
                    u => u.UserID,
                    r => r.UserId,
                    (u, r) => new EmployeeData
                    {
                        UserId = u.UserID,
                        Email = u.Email,
                        Fullname = u.Fullname,
                        Phone = u.Phone,
                        Role = "Lễ tân",
                        Status = u.Status == true ? "hoạt động" : "bị khóa" // Status = false là bị khoá
                    });

            var assistantUsers = _context.Users
                .Join(_context.Assistants,
                    u => u.UserID,
                    a => a.UserId,
                    (u, a) => new EmployeeData
                    {
                        UserId = u.UserID,
                        Email = u.Email,
                        Fullname = u.Fullname,
                        Phone = u.Phone,
                        Role = "Trợ thủ",
                        Status = u.Status == true ? "hoạt động" : "bị khóa" // Status = false là bị khoá
                    });

            var ownerUsers = _context.Users
                .Join(_context.Owners,
                    u => u.UserID,
                    o => o.UserId,
                    (u, o) => new EmployeeData
                    {
                        UserId = u.UserID,
                        Email = u.Email,
                        Fullname = u.Fullname,
                        Phone = u.Phone,
                        Role = "Chủ phòng",
                        Status = u.Status == true ? "hoạt động" : "bị khóa" // Status = false là bị khoá
                    });

            var allUsers = await dentistUsers
                          .Union(receptionistUsers)
                          .Union(assistantUsers)
                          .Union(ownerUsers)
                          .Union(patientUsers)
                          .ToListAsync();
            // 3) Lấy danh sách giao dịch tài chính
            var financialTransactions = await _context.FinancialTransactions
                .AsNoTracking()
                .Select(ft => new FinancialTransactionData
                {
                    TransactionID = ft.TransactionID,
                    TransactionDate = ft.TransactionDate.HasValue ? ft.TransactionDate.Value.ToString("dd/MM/yyyy") : string.Empty,
                    Description = ft.Description,
                    TransactionType = ft.TransactionType == true ? "thu" : "chi", // True: Thu, False: Chi
                    Category = ft.Category,
                    PaymentMethod = ft.PaymentMethod ? "tiền mặt" : "chuyển khoản", // True: tiền mặt, False: chuyển khoản
                    Amount = ft.Amount,
                    EvidenceImage = ft.EvidenceImage,
                    Status = ft.status  
                })
                .ToListAsync(ct);
            return new OwnerData
            {
                Scope = "Dữ liệu chung của toàn bộ lịch làm việc của bác sĩ, thông tin nhân viên, danh sách thu chi",
                DentistSchedules = dentistSchedules,
                EmployeeDatas = allUsers,
                FinancialTransactions = financialTransactions
            };
        }
        public async Task<DentistData> GetDentistData(int userId, CancellationToken ct)
        {
            // 1) Lấy danh sách lịch hẹn của bác sĩ
            var appointments = await _context.Appointments
                  .Include(a => a.Patient).ThenInclude(p => p.User)
                  .Include(a => a.Dentist).ThenInclude(d => d.User)
                  .Where(a => a.Dentist.User.UserID == userId)
                  .OrderBy(a => a.AppointmentId)
                  .ToListAsync();

            var appIds = appointments.Select(a => a.AppointmentId).ToList();

            // Dùng dictionary để truy nhanh theo AppointmentId
            var prescriptionDict = await _context.Prescriptions
               .Where(p => p.AppointmentId != null && appIds.Contains(p.AppointmentId.Value))
               .ToDictionaryAsync(p => p.AppointmentId!.Value);

            var instructionDict = await _context.Instructions
                .Where(i => i.AppointmentId != null && appIds.Contains(i.AppointmentId.Value))
                .ToDictionaryAsync(i => i.AppointmentId!.Value);


            var resultApp = appointments.Select(app =>
            {
                prescriptionDict.TryGetValue(app.AppointmentId, out var pres);
                instructionDict.TryGetValue(app.AppointmentId, out var inst);

                return new AppointmentData
                {
                    AppointmentId = app.AppointmentId,
                    PatientName = app.Patient.User.Fullname,
                    DentistName = app.Dentist.User.Fullname,
                    AppointmentDate = app.AppointmentDate,
                    appointmentTime = app.AppointmentTime.ToString(@"hh\:mm"),
                    AppointmentType = app.AppointmentType,
                    IsNewPatient = app.IsNewPatient,
                    Status = app.Status,
                    isExistPrescription = pres != null,
                    isExistInstructions = inst != null,
                    PrescriptionDetails = pres != null ? pres.Content : "không có đơn thuốc",
                    InstructionsDetails = inst != null ? inst.Content : "không có đơn thuốc"
                };
            }).ToList();

            // 2) Lấy danh sách lịch làm việc của bác sĩ
            var dentistSchedules = await _context.Schedules
                .AsNoTracking()
                .Where(s => s.IsActive && s.Status == "approved" && s.Dentist.User.UserID == userId)
                .GroupBy(s => new { s.DentistId, s.Dentist.User.Fullname })
                .Select(g => new DentistScheduleDTO
                {
                    DentistID = g.Key.DentistId,
                    DentistName = g.Key.Fullname,
                    Schedules = g.Select(s => new ScheduleDTO
                    {
                        ScheduleId = s.ScheduleId,
                        WorkDate = s.WorkDate,
                        Shift = s.Shift, // morning/afternoon/evening
                        Status = s.Status,
                        Workload = s.Dentist.Appointments.Count <= 2 ? "free"
                            : s.Dentist.Appointments.Count <= 4 ? "busy" : "full"
                    }).ToList()
                })
                .ToListAsync(ct);

            return new DentistData
            {
                Scope = "Dữ liệu lịch hẹn và lịch làm việc riêng của bác sĩ",
                Appointments = resultApp,
                DentistSchedules = dentistSchedules
            };
        }
        public async Task<PatientData> GetPatientData(int userId, CancellationToken ct)
        {
            // 1) Lấy danh sách lịch hẹn của bệnh nhân
            var appointments = await _context.Appointments
                  .Include(a => a.Patient).ThenInclude(p => p.User)
                  .Include(a => a.Dentist).ThenInclude(d => d.User)
                  .Where(a => a.Patient.User.UserID == userId)
                  .OrderBy(a => a.AppointmentId)
                  .ToListAsync();

            var appIds = appointments.Select(a => a.AppointmentId).ToList();

            // Dùng dictionary để truy nhanh theo AppointmentId
            var prescriptionDict = await _context.Prescriptions
               .Where(p => p.AppointmentId != null && appIds.Contains(p.AppointmentId.Value))
               .ToDictionaryAsync(p => p.AppointmentId!.Value);

            var instructionDict = await _context.Instructions
                .Where(i => i.AppointmentId != null && appIds.Contains(i.AppointmentId.Value))
                .ToDictionaryAsync(i => i.AppointmentId!.Value);


            var resultApp = appointments.Select(app =>
            {
                prescriptionDict.TryGetValue(app.AppointmentId, out var pres);
                instructionDict.TryGetValue(app.AppointmentId, out var inst);

                return new AppointmentData
                {
                    AppointmentId = app.AppointmentId,
                    PatientName = app.Patient.User.Fullname,
                    DentistName = app.Dentist.User.Fullname,
                    AppointmentDate = app.AppointmentDate,
                    appointmentTime = app.AppointmentTime.ToString(@"hh\:mm"),
                    AppointmentType = app.AppointmentType,
                    IsNewPatient = app.IsNewPatient,
                    Status = app.Status,
                    isExistPrescription = pres != null,
                    isExistInstructions = inst != null,
                    PrescriptionDetails = pres != null ? pres.Content : "không có đơn thuốc",
                    InstructionsDetails = inst != null ? inst.Content : "không có đơn thuốc"
                };
            }).ToList();

            // 2) Lấy danh sách hóa đơn của bệnh nhân
            var invoices = await _context.Invoices
                .Include(i => i.Patient).ThenInclude(p => p.User)
                .Where(i => i.PatientId == userId && !i.IsDeleted)
                .Select(i => new InvoiceData
                {
                    OrderCode = i.OrderCode,
                    PatientName = i.Patient.User.Fullname,
                    TotalAmount = i.TotalAmount,
                    AmountPaid = i.PaidAmount,
                    AmountRemain = i.RemainingAmount,
                    TransactionType = i.TransactionType,
                    TransactionDate = i.PaymentDate.HasValue ? i.PaymentDate.Value.ToString("dd/MM/yyyy") : string.Empty,
                    PaymenMethod = i.PaymentMethod
                })
                .ToListAsync(ct);

            return new PatientData
            {
                Scope = "Dữ liệu về lịch hẹn và hóa đơn thanh thanh toán riêng của bệnh nhân",
                Appointments = resultApp,
                Invoices = invoices,
            };
        }
        public async Task<ReceptionistData> GetReceptionistData(int userId, CancellationToken ct)
        {
            // 1) Lấy ra toàn bộ hóa đơn
            var invoices = await _context.Invoices
                .Include(i => i.Patient).ThenInclude(p => p.User)
                .Where(i => !i.IsDeleted)
                .OrderByDescending(i => i.PaymentDate)
                .Select(i => new InvoiceData
                {
                    OrderCode = i.OrderCode,
                    PatientName = i.Patient.User.Fullname,
                    TotalAmount = i.TotalAmount,
                    AmountPaid = i.PaidAmount,
                    AmountRemain = i.RemainingAmount,
                    TransactionType = i.TransactionType,
                    TransactionDate = i.PaymentDate.HasValue ? i.PaymentDate.Value.ToString("dd/MM/yyyy") : string.Empty,

                    PaymenMethod = i.PaymentMethod
                })
                .ToListAsync(ct);

            // 2) Lấy ra toàn bộ chương trình khuyến mãi
            var promotions = await _context.DiscountPrograms
                .OrderByDescending(p => p.CreateDate)
                .Select(p => new PromotionData
                {
                    PromotionId = p.DiscountProgramID,
                    PromotionName = p.DiscountProgramName,
                    StartDate = p.CreateDate,
                    EndDate = p.EndDate,
                })
                .ToListAsync(ct);

            // 3) Lấy ra toàn bộ giao dịch tài chính
            var financialTransactions = await _context.FinancialTransactions
                .AsNoTracking()
                .OrderByDescending(ft => ft.TransactionDate)
                .Select(ft => new FinancialTransactionData
                {
                    TransactionID = ft.TransactionID,
                    TransactionDate = ft.TransactionDate.HasValue ? ft.TransactionDate.Value.ToString("dd/MM/yyyy") : string.Empty,
                    Description = ft.Description,
                    TransactionType = ft.TransactionType == true ? "thu" : "chi", // True: Thu, False: Chi
                    Category = ft.Category,
                    PaymentMethod = ft.PaymentMethod ? "tiền mặt" : "chuyển khoản", // True: tiền mặt, False: chuyển khoản
                    Amount = ft.Amount,
                    EvidenceImage = ft.EvidenceImage,
                    Status = ft.status
                })
                .ToListAsync(ct);
            return new ReceptionistData
            {
                Scope = "Dữ liệu chung của toàn bộ hóa đơn, chương trình khuyến mãi, phiếu thu chi",
                InvoicesDatas = invoices,
                promotionDatas = promotions,
                financialTransactionDatas = financialTransactions
            };
        }
        public async Task<AssistantData> GetAssistanttData(int userId, CancellationToken ct)
        {
            // 1) Lấy ra toàn bộ nhiệm vụ của trợ lý
            var tasks = await _context.Tasks
                .Include(t => t.TreatmentProgress)
                .Include(t => t.Assistant).ThenInclude(a => a.User)
                .Where(t => t.AssistantID == userId)
                .OrderByDescending(t => t.TreatmentProgress.EndTime)
                .Select(t => new TaskData
                {
                    TaskId = t.TaskID,
                    TaskName = t.ProgressName,
                    Description = t.Description,
                    AssignedTo = t.Assistant != null && t.Assistant.User != null ? t.Assistant.User.Fullname : "N/A", // Ensure null checks
                    TaskDate = t.TreatmentProgress != null && t.TreatmentProgress.EndTime.HasValue
                        ? t.TreatmentProgress.EndTime.Value.ToString("dd/MM/yyyy")
                        : "N/A", // Avoid null propagation in expression trees
                    StartTime = t.StartTime.HasValue ? t.StartTime.Value.ToString(@"hh\:mm") : "N/A",
                    EndTime = t.EndTime.HasValue ? t.EndTime.Value.ToString(@"hh\:mm") : "N/A",
                    Status = t.Status == true ? "done" : "pending",
                })
                .ToListAsync(ct);

            return new AssistantData
            {
                Scope = "Dữ liệu chung của toàn bộ nhiệm vụ của trợ lý",
                TaskDatas = tasks
            };
        }
    }
}