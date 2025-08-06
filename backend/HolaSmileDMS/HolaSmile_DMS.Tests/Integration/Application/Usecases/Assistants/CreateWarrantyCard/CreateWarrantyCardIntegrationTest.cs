using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.CreateWarrantyCard;
using Application.Usecases.SendNotification;
using AutoMapper;
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
    public class CreateWarrantyCardIntegrationTest : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly CreateWarrantyCardHandler _handler;
        private readonly Mock<INotificationsRepository> _notificationRepoMock;

        public CreateWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase($"CreateWarrantyCardTestDb_{Guid.NewGuid()}"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            var mockMapper = new Mock<IMapper>();
            _mediatorMock = new Mock<IMediator>();
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            var warrantyRepo = new WarrantyCardRepository(_context);
            var treatmentRecordRepo = new TreatmentRecordRepository(_context, mockMapper.Object);

            _notificationRepoMock = new Mock<INotificationsRepository>();

            _handler = new CreateWarrantyCardHandler(
                warrantyRepo,
                treatmentRecordRepo,
                _httpContextAccessor,
                _notificationRepoMock.Object,
                _mediatorMock.Object
            );

            SeedData();
        }

        private void SetupHttpContext(string role, string userId = "1", string fullName = "Test Assistant")
        {
            var context = new DefaultHttpContext();
            context.User = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.GivenName, fullName)
            }, "TestAuth"));

            _httpContextAccessor.HttpContext = context;
        }

        private async System.Threading.Tasks.Task SeedData()
        {
            await _context.Database.EnsureDeletedAsync();

            var patient = new User
            {
                UserID = 2,
                Username = "patient01",
                Fullname = "Test Patient",
                Phone = "0123456789",
                Status = true
            };
            _context.Users.Add(patient);

            _context.Patients.Add(new Patient
            {
                PatientID = 2,
                UserID = 2,
                User = patient
            });

            _context.Appointments.Add(new Appointment
            {
                AppointmentId = 1,
                PatientId = 2
            });

            _context.Procedures.Add(new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Trám răng"
            });

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 1,
                ProcedureID = 1,
                AppointmentID = 1,
                TreatmentStatus = "Completed"
            });

            await _context.SaveChangesAsync();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant tạo thẻ bảo hành thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "1", "Test Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.WarrantyCardId > 0);
            Assert.Equal(6, result.Duration);
            Assert.True(result.Status);

            var card = await _context.WarrantyCards
                .Include(w => w.TreatmentRecord)
                .ThenInclude(t => t.Appointment)
                .FirstOrDefaultAsync(w => w.TreatmentRecordID == 1);

            Assert.NotNull(card);
            Assert.Equal(
                DateTime.Today.AddMonths(6).Date,
                card.EndDate.Date
            );
            Assert.Equal(1, card.CreateBy);

            // Verify notification với nội dung thực tế từ handler
            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 2 &&
                    n.Title == "Thẻ bảo hành đã được tạo" &&
                    n.Message == "Bạn đã được tạo thẻ bảo hành cho thủ thuật: Trám răng" &&
                    n.Type == "Create" &&
                    n.MappingUrl == "/patient/warranty-cards/1"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG53")]
        public async System.Threading.Tasks.Task UTCID02_NoLogin_Throws()
        {
            // Arrange
            _httpContextAccessor.HttpContext = null;

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Not assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_NotAssistant_Throws()
        {
            // Arrange
            SetupHttpContext("Patient");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Invalid TreatmentRecordId should throw MSG99")]
        public async System.Threading.Tasks.Task UTCID04_InvalidTreatmentRecordId_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 999,
                Duration = 6
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG99, ex.Message);
            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Procedure already has card should throw MSG100")]
        public async System.Threading.Tasks.Task UTCID05_ProcedureAlreadyHasCard_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 10,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddMonths(6),
                Duration = 6,
                Status = true,
                TreatmentRecordID = 1
            });
            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = 6
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG100, ex.Message);
            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID06 - Treatment not completed should throw MSG101")]
        public async System.Threading.Tasks.Task UTCID06_TreatmentNotCompleted_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            _context.TreatmentRecords.Add(new TreatmentRecord
            {
                TreatmentRecordID = 2,
                ProcedureID = 1,
                AppointmentID = 1,
                TreatmentStatus = "In progress"
            });
            await _context.SaveChangesAsync();

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 2,
                Duration = 6
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG101, ex.Message);
            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID07 - Invalid duration should throw MSG98")]
        public async System.Threading.Tasks.Task UTCID07_InvalidDuration_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new CreateWarrantyCardCommand
            {
                TreatmentRecordId = 1,
                Duration = -5
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<FormatException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);
            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}