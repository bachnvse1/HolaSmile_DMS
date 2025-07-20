using Application.Constants;
using Application.Usecases.Assistants.CreateInstruction;
using HDMS_API.Infrastructure.Persistence;
using HDMS_API.Infrastructure.Repositories;
using Infrastructure.Repositories;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class CreateInstructionIntegrationTests
    {
        private readonly ApplicationDbContext _context;
        private readonly CreateInstructionHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock = new();

        public CreateInstructionIntegrationTests()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("CreateInstructionDb"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var instructionRepo = new InstructionRepository(_context);
            var templateRepo = new InstructionTemplateRepository(_context);
            var appointmentRepo = new AppointmentRepository(_context);

            _handler = new CreateInstructionHandler(
                instructionRepo,
                _httpContextAccessor,
                templateRepo,
                appointmentRepo,
                _mediatorMock.Object
            );

            SeedData();
        }

        private void SetupHttpContext(string role)
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
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

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant tạo chỉ dẫn thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_CreateInstruction_Success()
        {
            SetupHttpContext("Assistant");

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 1,
                Content = "Test content"
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG114, result);
            Assert.Single(_context.Instructions.Where(x => !x.IsDeleted));
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Không đăng nhập => MSG26")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 1,
                Content = "Test content"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role không hợp lệ => MSG26")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_InvalidRole_Throws()
        {
            SetupHttpContext("Receptionist");

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 1,
                Content = "Test content"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Mẫu chỉ dẫn không tồn tại => MSG115")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_TemplateNotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 999,
                Content = "Test content"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG115, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Appointment không tồn tại => MSG28")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_AppointmentNotFound_Throws()
        {
            SetupHttpContext("Assistant");

            var command = new CreateInstructionCommand
            {
                AppointmentId = 999,
                Instruc_TemplateID = 1,
                Content = "Test content"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - Đã có instruction cho appointment này sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID06_InstructionAlreadyExists_Throws()
        {
            SetupHttpContext("Assistant");

            // Thêm instruction cho appointmentId = 1
            _context.Instructions.Add(new Instruction
            {
                AppointmentId = 1,
                Content = "Đã tồn tại",
                IsDeleted = false
            });
            _context.SaveChanges();

            var command = new CreateInstructionCommand
            {
                AppointmentId = 1,
                Instruc_TemplateID = 1,
                Content = "Test content"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal("Chỉ dẫn cho lịch hẹn này đã tồn tại, không thể tạo mới.", ex.Message);
        }
    }
}