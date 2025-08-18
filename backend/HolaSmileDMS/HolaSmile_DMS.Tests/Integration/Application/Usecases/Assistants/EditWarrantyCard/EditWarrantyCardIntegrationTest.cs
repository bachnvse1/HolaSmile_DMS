using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.EditWarrantyCard;
using Application.Usecases.SendNotification;
using Domain.Entities;
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
    public class EditWarrantyCardIntegrationTest : IDisposable
    {
        private readonly ApplicationDbContext _context;
        private readonly EditWarrantyCardHandler _handler;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly Mock<IMediator> _mediatorMock;

        public EditWarrantyCardIntegrationTest()
        {
            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase($"EditWarrantyCardTestDb_{Guid.NewGuid()}"));
            services.AddHttpContextAccessor();

            var provider = services.BuildServiceProvider();
            _context = provider.GetRequiredService<ApplicationDbContext>();
            _httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();

            _mediatorMock = new Mock<IMediator>();
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            var repository = new WarrantyCardRepository(_context);

            _handler = new EditWarrantyCardHandler(
                repository,
                _httpContextAccessor,
                _mediatorMock.Object
            );

            SeedData();
        }

        private async System.Threading.Tasks.Task SeedData()
        {
            await _context.Database.EnsureDeletedAsync();

            var patient = new Patient
            {
                PatientID = 10,
                UserID = 100,
                User = new User
                {
                    UserID = 100,
                    Username = "patient01",
                    Phone = "0123456789",
                    Fullname = "Test Patient",
                    Status = true
                }
            };
            _context.Patients.Add(patient);

            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 10,
                Patient = patient
            };
            _context.Appointments.Add(appointment);

            var treatmentRecord = new TreatmentRecord
            {
                TreatmentRecordID = 1,
                AppointmentID = 1,
                Appointment = appointment
            };
            _context.TreatmentRecords.Add(treatmentRecord);

            _context.WarrantyCards.Add(new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = DateTime.Today.AddMonths(-2),
                EndDate = DateTime.Today.AddMonths(4),
                Duration = 6,
                Status = true,
                CreatedAt = DateTime.Now.AddMonths(-2),
                CreateBy = 1,
                TreatmentRecordID = 1,
                TreatmentRecord = treatmentRecord,
                IsDeleted = false
            });

            await _context.SaveChangesAsync();
        }

        private void SetupHttpContext(string role, int userId, string fullName = "Test Assistant")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.GivenName, fullName)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessor.HttpContext = context;
        }

        [Fact(DisplayName = "Normal - ITCID01 - Assistant chỉnh sửa thẻ bảo hành thành công")]
        public async System.Threading.Tasks.Task Normal_ITCID01_EditWarrantyCard_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", 1, "Test Assistant");

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 12,
                Status = false
            };

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG106, result);

            var card = await _context.WarrantyCards
                .Include(w => w.TreatmentRecord)
                .ThenInclude(t => t.Appointment)
                .ThenInclude(a => a.Patient)
                .ThenInclude(p => p.User)
                .FirstAsync(w => w.WarrantyCardID == 1);

            Assert.NotNull(card);
            Assert.Equal(12, card.Duration);
            Assert.False(card.Status);
            Assert.Equal(card.StartDate.AddMonths(12), card.EndDate);
            Assert.NotNull(card.UpdatedAt);
            Assert.Equal(1, card.UpdatedBy);

            // Cập nhật phần verify trong test case
            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 100 &&
                    n.Title == "Cập nhật thẻ bảo hành" &&
                    n.Message == "Thẻ bảo hành của bạn đã được cập nhật. Thời hạn mới: 12 tháng." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == 1 &&
                    string.Equals(n.MappingUrl, "/patient/warranty-cards/1", StringComparison.Ordinal)
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - ITCID02 - Edit non-existing card should throw MSG103")]
        public async System.Threading.Tasks.Task ITCID02_EditWarrantyCard_NotFound()
        {
            // Arrange
            SetupHttpContext("Assistant", 1);

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 999,
                Duration = 6,
                Status = true
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG103, ex.Message);

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