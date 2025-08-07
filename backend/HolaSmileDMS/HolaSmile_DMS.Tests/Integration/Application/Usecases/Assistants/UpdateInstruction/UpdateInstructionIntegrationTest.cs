using Application.Usecases.Assistants.UpdateInstruction;
using Application.Usecases.SendNotification;
using HDMS_API.Infrastructure.Persistence;
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
    public class UpdateInstructionIntegrationTest
    {
        private readonly ApplicationDbContext _context;
        private readonly UpdateInstructionHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly InstructionRepository _instructionRepo;
        private readonly InstructionTemplateRepository _templateRepo;
        private readonly Mock<IMediator> _mediatorMock;

        public UpdateInstructionIntegrationTest()
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("UpdateInstructionDb_Integration"));

            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();

            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
            _mediatorMock = new Mock<IMediator>();

            _instructionRepo = new InstructionRepository(_context);
            _templateRepo = new InstructionTemplateRepository(_context);

            _handler = new UpdateInstructionHandler(
                _instructionRepo,
                _templateRepo,
                _httpContextAccessor,
                _mediatorMock.Object
            );

            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            SeedData();
        }

        private void SetupHttpContext(string role, int userId, string fullName = "Test Assistant")
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.GivenName, fullName)
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

            var patient = new User { UserID = 1, Username = "0111111111", Fullname = "Patient A", Phone = "0111111111" };
            var dentist = new User { UserID = 2, Username = "0111111112", Fullname = "Dentist B", Phone = "0111111112" };

            _context.Users.AddRange(patient, dentist);

            var patientEntity = new Patient { PatientID = 1, UserID = 1, User = patient };
            _context.Patients.Add(patientEntity);
            _context.Dentists.Add(new Dentist { DentistId = 1, UserId = 2 });

            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 1,
                Patient = patientEntity
            };
            _context.Appointments.Add(appointment);

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
                Appointment = appointment,
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
            // Arrange
            SetupHttpContext("Assistant", 2, "Test Assistant");

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content",
                Instruc_TemplateID = 1
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal("Cập nhật chỉ dẫn thành công", result);

            var updated = await _context.Instructions
                .Include(x => x.Appointment)
                .ThenInclude(x => x.Patient)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.InstructionID == 100);

            Assert.NotNull(updated);
            Assert.Equal("Updated content", updated.Content);
            Assert.Equal(1, updated.Instruc_TemplateID);
            Assert.NotNull(updated.UpdatedAt);
            Assert.Equal(2, updated.UpdatedBy);

            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 1 &&
                    n.Title == "Cập nhật chỉ dẫn điều trị" &&
                    n.Message == "Chỉ dẫn điều trị của bạn vừa được cập nhật." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == 100 &&
                    string.Equals(n.MappingUrl, "/patient/instructions/1", StringComparison.Ordinal)
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_NotLoggedIn_Throws()
        {
            // Arrange
            _httpContextAccessor.HttpContext = null;

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role không hợp lệ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID03_InvalidRole_Throws()
        {
            // Arrange
            SetupHttpContext("Receptionist", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Instruction không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID04_InstructionNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 999,
                Content = "Updated content"
            };

            // Act & Assert
            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Template không tồn tại sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_TemplateNotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Dentist", 2);

            var command = new UpdateInstructionCommand
            {
                InstructionId = 100,
                Content = "Updated content",
                Instruc_TemplateID = 999
            };

            // Act & Assert
            await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }
    }
}