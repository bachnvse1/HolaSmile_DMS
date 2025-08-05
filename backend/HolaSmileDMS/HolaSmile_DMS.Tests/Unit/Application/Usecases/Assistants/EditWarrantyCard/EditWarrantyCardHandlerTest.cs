using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.EditWarrantyCard;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class EditWarrantyCardHandlerTests
    {
        private readonly Mock<IWarrantyCardRepository> _warrantyRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly EditWarrantyCardHandler _handler;

        public EditWarrantyCardHandlerTests()
        {
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            _handler = new EditWarrantyCardHandler(
                _warrantyRepoMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "10", string fullName = "Test Assistant")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? ""),
                new Claim(ClaimTypes.GivenName, fullName)
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "Normal - UTCID01 - Assistant chỉnh sửa thẻ bảo hành thành công")]
        public async System.Threading.Tasks.Task Normal_UTCID01_Assistant_EditWarrantyCard_Success()
        {
            // Arrange
            SetupHttpContext("Assistant", "99", "Test Assistant");

            var patient = new Patient
            {
                PatientID = 10,
                UserID = 100,
                User = new User { UserID = 100, Fullname = "Test Patient" }
            };

            var appointment = new Appointment
            {
                AppointmentId = 1,
                PatientId = 10,
                Patient = patient
            };

            var treatmentRecord = new TreatmentRecord
            {
                TreatmentRecordID = 50,
                AppointmentID = 1,
                Appointment = appointment
            };

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = new DateTime(2024, 1, 1),
                Duration = 12,
                EndDate = new DateTime(2025, 1, 1),
                Status = true,
                TreatmentRecordID = 50,
                TreatmentRecord = treatmentRecord
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            _warrantyRepoMock.Setup(r => r.UpdateWarrantyCardAsync(It.IsAny<WarrantyCard>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 24,
                Status = false
            };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG106, result);
            Assert.Equal(24, card.Duration);
            Assert.Equal(new DateTime(2026, 1, 1), card.EndDate);
            Assert.False(card.Status);
            Assert.Equal(99, card.UpdatedBy);

            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 100 &&
                    n.Title == "Cập nhật thẻ bảo hành" &&
                    n.Message == "Thẻ bảo hành của bạn đã được cập nhật. Thời hạn mới: 24 tháng." &&
                    n.Type == "Update" &&
                    n.RelatedObjectId == card.WarrantyCardID &&
                    n.MappingUrl == $"/patient/warranty-cards/{card.WarrantyCardID}"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Abnormal - UTCID02 - Không đăng nhập sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID02_NotLoggedIn_Throws()
        {
            // Arrange
            SetupHttpContext(null);

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 12,
                Status = true
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Thời hạn không hợp lệ sẽ bị chặn")]
        public async System.Threading.Tasks.Task Abnormal_UTCID05_Invalid_Duration_Should_Throw_MSG98()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                StartDate = new DateTime(2024, 1, 1),
                Duration = 12
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            var command = new EditWarrantyCardCommand
            {
                WarrantyCardId = 1,
                Duration = 0,
                Status = true
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG98, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }
    }
}