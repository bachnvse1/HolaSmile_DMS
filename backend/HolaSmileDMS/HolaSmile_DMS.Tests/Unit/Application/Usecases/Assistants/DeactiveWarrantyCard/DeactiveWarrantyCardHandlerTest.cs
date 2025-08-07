using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Assistant.DeactiveWarrantyCard;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Assistants
{
    public class DeactiveWarrantyCardHandlerTests
    {
        private readonly Mock<IWarrantyCardRepository> _warrantyRepoMock = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly DeactiveWarrantyCardHandler _handler;

        public DeactiveWarrantyCardHandlerTests()
        {
            _mediatorMock
                .Setup(x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(MediatR.Unit.Value);

            _handler = new DeactiveWarrantyCardHandler(
                _warrantyRepoMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string? role, string? userId = "99", string fullName = "Test Assistant")
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

        [Fact(DisplayName = "Success - UTCID01 - Assistant deactivates warranty card successfully")]
        public async System.Threading.Tasks.Task UTCID01_Assistant_Deactivates_WarrantyCard_Successfully()
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
                Status = true,
                TreatmentRecordID = 50,
                TreatmentRecord = treatmentRecord
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            _warrantyRepoMock.Setup(r => r.DeactiveWarrantyCardAsync(card, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG105, result);
            Assert.False(card.Status);
            Assert.Equal(99, card.UpdatedBy);

            _mediatorMock.Verify(m => m.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 100 &&
                    n.Title == "Vô hiệu hóa thẻ bảo hành" &&
                    n.Message == "Thẻ bảo hành của bạn đã bị vô hiệu hóa." &&
                    n.Type == "Delete" &&
                    n.RelatedObjectId == card.TreatmentRecordID &&
                    n.MappingUrl == $"/patient/treatment-records/{card.TreatmentRecordID}/warranty"
                ),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "Error - UTCID02 - HttpContext is null throws MSG17")]
        public async System.Threading.Tasks.Task UTCID02_HttpContext_Is_Null_Throws()
        {
            // Arrange
            SetupHttpContext(null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG17, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Error - UTCID03 - Not Assistant role throws MSG26")]
        public async System.Threading.Tasks.Task UTCID03_Not_Assistant_Role_Throws()
        {
            // Arrange
            SetupHttpContext("Patient");

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Error - UTCID04 - Warranty card not found throws MSG102")]
        public async System.Threading.Tasks.Task UTCID04_Card_Not_Found_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((WarrantyCard?)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG103, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact(DisplayName = "Error - UTCID05 - Card already deactivated throws MSG103")]
        public async System.Threading.Tasks.Task UTCID05_Already_Deactivated_Throws()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var card = new WarrantyCard
            {
                WarrantyCardID = 1,
                Status = false
            };

            _warrantyRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(card);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _handler.Handle(new DeactiveWarrantyCardCommand { WarrantyCardId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG104, ex.Message);

            _mediatorMock.Verify(m => m.Send(
                It.IsAny<SendNotificationCommand>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }
    }
}