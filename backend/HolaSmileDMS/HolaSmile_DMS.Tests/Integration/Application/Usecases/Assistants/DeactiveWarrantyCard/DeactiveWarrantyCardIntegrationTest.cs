using Application.Constants;
using Application.Usecases.Assistant.DeactiveWarrantyCard;
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
    public class DeactiveWarrantyCardIntegrationTest : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly DeactiveWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock;

        public DeactiveWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase($"DeactiveWarrantyCardTestDb_{Guid.NewGuid()}"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _mediatorMock = new Mock<IMediator>();
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            var warrantyRepo = new WarrantyCardRepository(_context);

            _handler = new DeactiveWarrantyCardHandler(
                warrantyRepo,
                _httpContextAccessor,
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

            // Tạo User đầy đủ thông tin
            var user = new User
            {
                UserID = 100,
                Username = "patient1",
                Phone = "0123456789",
                Fullname = "Test Patient",
                Status = true,
                CreatedAt = DateTime.Now
            };
            _context.Users.Add(user);

            var patient = new Patient
            {
                PatientID = 10,
                UserID = 100,
                User = user,
                CreatedAt = DateTime.Now
            };
            _context.Patients.Add(patient);

            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 10,
                Patient = patient,
                CreatedAt = DateTime.Now
            };
            _context.Appointments.Add(appointment);

            var procedure = new Procedure
            {
                ProcedureId = 1,
                ProcedureName = "Test Procedure"
            };
            _context.Procedures.Add(procedure);

            var treatmentRecord = new TreatmentRecord
            {
                TreatmentRecordID = 1,
                ProcedureID = 1,
                AppointmentID = 1,
                Appointment = appointment,
                TreatmentStatus = "Completed",
                CreatedAt = DateTime.Now
            };
            _context.TreatmentRecords.Add(treatmentRecord);

            var treatmentRecord2 = new TreatmentRecord
            {
                TreatmentRecordID = 2,
                ProcedureID = 1,
                AppointmentID = 1,
                Appointment = appointment,
                TreatmentStatus = "Completed",
                CreatedAt = DateTime.Now
            };
            _context.TreatmentRecords.Add(treatmentRecord2);

            // Card còn active
            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 1,
                TreatmentRecordID = 1,
                TreatmentRecord = treatmentRecord,
                StartDate = DateTime.Now.AddMonths(-6),
                EndDate = DateTime.Now.AddMonths(6),
                Duration = 12,
                Status = true,
                CreatedAt = DateTime.Now
            });

            // Card đã deactive
            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 2,
                TreatmentRecordID = 2,
                TreatmentRecord = treatmentRecord2,
                StartDate = DateTime.Now.AddMonths(-12),
                EndDate = DateTime.Now,
                Duration = 12,
                Status = false,
                CreatedAt = DateTime.Now
            });

            await _context.SaveChangesAsync();
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant vô hiệu hóa thẻ bảo hành thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_DeactivateWarrantyCard_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "1", "Test Assistant");
            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 1 };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG105, result);

            var card = await _context.WarrantyCards
                .Include(w => w.TreatmentRecord)
                .ThenInclude(t => t.Appointment)
                .ThenInclude(a => a.Patient)
                .FirstAsync(w => w.WarrantyCardID == 1);

            Assert.NotNull(card);
            Assert.False(card.Status);
            Assert.Equal(1, card.UpdatedBy);
            Assert.NotNull(card.UpdatedAt);

            // Verify notification với nội dung chính xác từ handler
            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 100 &&
                    n.Title == "Vô hiệu hóa thẻ bảo hành" &&
                    n.Message == "Thẻ bảo hành của bạn đã bị vô hiệu hóa." &&
                    n.Type == "Delete" &&
                    n.RelatedObjectId == 1 &&
                    string.Equals(n.MappingUrl, "/patient/treatment-records/1/warranty", StringComparison.Ordinal)
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Not logged in should throw MSG17")]
        public async System.Threading.Tasks.Task UTCID02_DeactivateWarrantyCard_NoLogin_Throws()
        {
            // Arrange
            _httpContextAccessor.HttpContext = null;

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role is not assistant should throw MSG26")]
        public async System.Threading.Tasks.Task UTCID03_DeactivateWarrantyCard_WrongRole_Throws()
        {
            // Arrange
            SetupHttpContext("Patient");

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - WarrantyCard does not exist should throw MSG103")]
        public async System.Threading.Tasks.Task UTCID04_DeactivateWarrantyCard_NotFound_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 999 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG103, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Thẻ bảo hành đã bị vô hiệu hóa")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_DeactivateWarrantyCard_AlreadyInactive_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");
            var command = new DeactiveWarrantyCardCommand { WarrantyCardId = 2 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG104, ex.Message);

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