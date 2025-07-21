using Application.Usecases.Assistants.UpdateInstruction;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Assistants
{
    public class UpdateInstructionIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdateInstructionHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly InstructionRepository _instructionRepo;
        private readonly InstructionTemplateRepository _templateRepo;

        public UpdateInstructionIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("UpdateInstructionDb_Integration"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _instructionRepo = new InstructionRepository(_context);
            _templateRepo = new InstructionTemplateRepository(_context);

            _handler = new UpdateInstructionHandler(
                _instructionRepo,
                _templateRepo,
                _httpContextAccessor
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

            _context.Instructions.Add(new Instruction
            {
                InstructionID = 100,
                AppointmentId = 1,
                Instruc_TemplateID = 1,
                Content = "Old content",
                CreatedAt = DateTime.Now.AddDays(-1),
                CreateBy = 2,
                IsDeleted = false
            });

            _context.SaveChanges();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant cập nhật chỉ dẫn thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_Assistant_UpdateInstruction_Success()
        {
            SetupHttpContext("Assistant", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content",
                Instruc_TemplateID = 1
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal("Cập nhật chỉ dẫn thành công", result);
            var updated = _context.Instructions.FirstOrDefault(x => x.InstructionID == 100);
            Assert.NotNull(updated);
            Assert.Equal("Updated content", updated.Content);
            Assert.Equal(1, updated.Instruc_TemplateID);
            Assert.NotNull(updated.UpdatedAt);
            Assert.Equal(2, updated.UpdatedBy);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_NotLoggedIn_Throws()
        {
            _httpContextAccessor.HttpContext = null;

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role không hợp lệ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_InvalidRole_Throws()
        {
            SetupHttpContext("Receptionist", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Instruction không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_InstructionNotFound_Throws()
        {
            SetupHttpContext("Assistant", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 999,
                Content = "Updated content"
            };

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Template không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_TemplateNotFound_Throws()
        {
            SetupHttpContext("Dentist", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content",
                Instruc_TemplateID = 999
            };

            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));
        }
    }
}