using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.DeleteTreatmentRecord;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class DeactiveTreatmentRecordHandlerTest
    {
        private readonly Mock<ITreatmentRecordRepository> _treatmentRecordRepoMock;
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IPatientRepository> _patientRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly DeleteTreatmentRecordHandler _handler;

        public DeactiveTreatmentRecordHandlerTest()
        {
            _treatmentRecordRepoMock = new Mock<ITreatmentRecordRepository>();
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _patientRepoMock = new Mock<IPatientRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _mediatorMock = new Mock<IMediator>();

            _handler = new DeleteTreatmentRecordHandler(
                _treatmentRecordRepoMock.Object,
                _httpContextAccessorMock.Object,
                _mediatorMock.Object,
                _appointmentRepoMock.Object,
                _patientRepoMock.Object
            );
        }

        private void SetupHttpContext(string? role = null, string? userId = "1", string? fullName = "Test Dentist")
        {
            if (role == null)
            {
                _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext?)null);
                return;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId ?? "0"),
                new Claim(ClaimTypes.GivenName, fullName ?? "")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Delete treatment record successfully")]
        public async System.Threading.Tasks.Task UTCID01_Delete_Treatment_Record_Successfully()
        {
            // Arrange
            SetupHttpContext("Dentist", "1", "Dr. Smith");

            var treatmentRecord = new TreatmentRecord { TreatmentRecordID = 1, AppointmentID = 1 };
            var appointment = new Appointment { AppointmentId = 1, PatientId = 1 };
            var patient = new Patient
            {
                PatientID = 1,
                UserID = 10,
                User = new User { Fullname = "John Doe" }
            };

            _treatmentRecordRepoMock
                .Setup(r => r.GetTreatmentRecordByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(treatmentRecord);

            _appointmentRepoMock
                .Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(appointment);

            _patientRepoMock
                .Setup(r => r.GetPatientByPatientIdAsync(1))
                .ReturnsAsync(patient);

            _treatmentRecordRepoMock
                .Setup(r => r.DeleteTreatmentRecordAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var command = new DeleteTreatmentRecordCommand { TreatmentRecordId = 1 };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.True(result);

            // Verify notification was sent
            _mediatorMock.Verify(x => x.Send(
                It.Is<SendNotificationCommand>(n =>
                    n.UserId == 10 &&
                    n.Title == "Xóa hồ sơ điều trị" &&
                    n.Message == "Hồ sơ điều trị #1 của John Doe đã được nha sĩ Dr. Smith xoá!!!" &&
                    n.Type == "Xoá hồ sơ" &&
                    n.RelatedObjectId == 1 &&
                    n.MappingUrl == "patient/view-treatment-records?patientId=1"),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact(DisplayName = "UTCID02 - Not logged in should throw unauthorized")]
        public async System.Threading.Tasks.Task UTCID02_Not_Logged_In_Should_Throw()
        {
            // Arrange
            SetupHttpContext(null);

            var command = new DeleteTreatmentRecordCommand { TreatmentRecordId = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

            // Verify no notification was sent
            _mediatorMock.Verify(
                x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact(DisplayName = "UTCID03 - Non-dentist role should throw unauthorized")]
        public async System.Threading.Tasks.Task UTCID03_Non_Dentist_Role_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Assistant");

            var command = new DeleteTreatmentRecordCommand { TreatmentRecordId = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);

            // Verify no notification was sent
            _mediatorMock.Verify(
                x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact(DisplayName = "UTCID04 - Treatment record not found should throw KeyNotFoundException")]
        public async System.Threading.Tasks.Task UTCID04_Record_Not_Found_Should_Throw()
        {
            // Arrange
            SetupHttpContext("Dentist");

            _treatmentRecordRepoMock
                .Setup(r => r.GetTreatmentRecordByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((TreatmentRecord?)null);

            var command = new DeleteTreatmentRecordCommand { TreatmentRecordId = 1 };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG27, ex.Message);

            // Verify no notification was sent
            _mediatorMock.Verify(
                x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact(DisplayName = "UTCID05 - Delete fails should return false")]
        public async System.Threading.Tasks.Task UTCID05_Delete_Fails_Should_Return_False()
        {
            // Arrange
            SetupHttpContext("Dentist", "1", "Dr. Smith");

            var treatmentRecord = new TreatmentRecord { TreatmentRecordID = 1 };

            _treatmentRecordRepoMock
                .Setup(r => r.GetTreatmentRecordByIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(treatmentRecord);

            _treatmentRecordRepoMock
                .Setup(r => r.DeleteTreatmentRecordAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            var command = new DeleteTreatmentRecordCommand { TreatmentRecordId = 1 };

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.False(result);

            // Verify no notification was sent since delete failed
            _mediatorMock.Verify(
                x => x.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }
    }
}