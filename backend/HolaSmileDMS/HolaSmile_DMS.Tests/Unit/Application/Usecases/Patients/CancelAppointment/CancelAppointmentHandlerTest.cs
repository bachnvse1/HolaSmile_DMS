using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Patients.CancelAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Patients
{
    public class CancelAppointmentHandleTests
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IDentistRepository> _dentistRepoMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepoMock;
        private readonly Mock<IMediator> _mediatorMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly CancelAppointmentHandle _handler;

        public CancelAppointmentHandleTests()
        {
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _dentistRepoMock = new Mock<IDentistRepository>();
            _userCommonRepoMock = new Mock<IUserCommonRepository>();
            _mediatorMock = new Mock<IMediator>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new CancelAppointmentHandle(
                _appointmentRepoMock.Object,
                _httpContextAccessorMock.Object,
                _dentistRepoMock.Object,
                _userCommonRepoMock.Object,
                _mediatorMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            var context = new DefaultHttpContext { User = claimsPrincipal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        // 🔵 Normal Case
        [Fact(DisplayName = "Normal - UTCID01 - Patient cancels confirmed appointment successfully")]
        public async System.Threading.Tasks.Task UTCID01_CancelConfirmedAppointment_Success()
        {
            // Arrange
            SetupHttpContext("patient", 5);

            var appointment = new Appointment
            {
                AppointmentId = 10,
                Status = "Confirmed",
                AppointmentTime = TimeSpan.Parse("13:00:00"),
                AppointmentDate = DateTime.Today,
                DentistId = 2
            };

            var dentist = new Dentist
            {
                User = new User { UserID = 99 }
            };

            var receptionists = new List<Receptionist>
            {
                new Receptionist { UserId = 101 },
                new Receptionist { UserId = 102 }
            };

            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(10)).ReturnsAsync(appointment);
            _appointmentRepoMock.Setup(r => r.CancelAppointmentAsync(10, 5)).ReturnsAsync(true);
            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(2)).ReturnsAsync(dentist);
            _userCommonRepoMock.Setup(r => r.GetAllReceptionistAsync()).ReturnsAsync(receptionists);

            // Act
            var result = await _handler.Handle(new CancelAppointmentCommand(10), CancellationToken.None);

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG06, result);
        }

        // 🔴 Abnormal Cases

        [Fact(DisplayName = "Abnormal - UTCID02 - Unauthorized user returns error")]
        public async System.Threading.Tasks.Task UTCID02_UnauthorizedUser_ThrowsException()
        {
            // Arrange
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext()); // No user

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CancelAppointmentCommand(1), CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID03 - Role is not patient returns error")]
        public async System.Threading.Tasks.Task UTCID03_NonPatientRole_ThrowsException()
        {
            // Arrange
            SetupHttpContext("receptionist", 5);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CancelAppointmentCommand(1), CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID04 - Appointment not found")]
        public async System.Threading.Tasks.Task UTCID04_AppointmentNotFound_ThrowsException()
        {
            // Arrange
            SetupHttpContext("patient", 5);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(99)).ReturnsAsync((Appointment)null!);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new CancelAppointmentCommand(99), CancellationToken.None));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        [Fact(DisplayName = "Abnormal - UTCID05 - Appointment not in Confirmed status")]
        public async System.Threading.Tasks.Task UTCID05_AppointmentNotConfirmed_ThrowsException()
        {
            // Arrange
            SetupHttpContext("patient", 5);
            var appointment = new Appointment { AppointmentId = 1, Status = "Pending" };
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(appointment);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(new CancelAppointmentCommand(1), CancellationToken.None));
            Assert.Equal("Bạn chỉ có thể hủy lịch ở trạng thái xác nhận", ex.Message);
        }

    }
}
