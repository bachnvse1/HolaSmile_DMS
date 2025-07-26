using Application.Constants;
using Application.Usecases.Patients.ViewInstruction;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Patients
{
    public class ViewInstructionIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly ViewInstructionHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewInstructionIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("ViewInstructionDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var instructionRepo = new InstructionRepository(_context);
            var templateRepo = new InstructionTemplateRepository(_context);
            var appointmentRepo = new AppointmentRepository(_context);

            _handler = new ViewInstructionHandler(
                instructionRepo,
                appointmentRepo,
                _httpContextAccessor,
                templateRepo
            );

            SeedData();
        }

        private void SetupHttpContext(string role, int userId)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private void SeedData()
        {
            _context.Users.RemoveRange(_context.Users);
            _context.Patients.RemoveRange(_context.Patients);
            _context.Dentists.RemoveRange(_context.Dentists);
            _context.Appointments.RemoveRange(_context.Appointments);
            _context.InstructionTemplates.RemoveRange(_context.InstructionTemplates);
            _context.Instructions.RemoveRange(_context.Instructions);
            _context.SaveChanges();

            _context.Users.AddRange(
                new User { UserID = 1, Username = "0111111111", Fullname = "Patient A", Phone = "0111111111" },
                new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" }
            );

            _context.Patients.Add(new Patient { PatientID = 1, UserID = 1 });
            _context.Dentists.Add(new Dentist { DentistId = 1, UserId = 2 });

            _context.InstructionTemplates.Add(new InstructionTemplate
            {
                Instruc_TemplateID = 1,
                Instruc_TemplateName = "TEMPLATE",
                Instruc_TemplateContext = "Use this content",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            });

            _context.Appointments.Add(new Appointment
            {
                AppointmentId = 1,
                AppointmentDate = DateTime.Today,
                AppointmentTime = new TimeSpan(10, 0, 0),
                Status = "confirmed",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,
                PatientId = 1,
                DentistId = 1
            });

            _context.Instructions.Add(new Instruction
            {
                InstructionID = 100,
                AppointmentId = 1,
                Instruc_TemplateID = 1,
                Content = "Instruction content",
                CreatedAt = DateTime.Now,
                CreateBy = 2,
                IsDeleted = false
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Patient xem chỉ dẫn thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_Patient_ViewInstructions_Success()
        {
            SetupHttpContext("Patient", 1);

            var command = new ViewInstructionCommand();
            var result = await _handler.Handle(command, default);

            Assert.Single(result);
            var dto = result.First();
            Assert.Equal(100, dto.InstructionId);
            Assert.Equal(1, dto.AppointmentId);
            Assert.Equal("Instruction content", dto.Content);
            Assert.Equal("TEMPLATE", dto.Instruc_TemplateName);
            Assert.Equal("Use this content", dto.Instruc_TemplateContext);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new ViewInstructionCommand();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role không có quyền sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_InvalidRole_Throws()
        {
            SetupHttpContext("Owner", 1);

            var command = new ViewInstructionCommand();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Truyền appointmentId không thuộc về mình sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_InvalidAppointmentId_Throws()
        {
            SetupHttpContext("Patient", 1);

            var command = new ViewInstructionCommand(999);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));
        }
    }
}