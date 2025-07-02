using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.EditAppointment;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Receptionists.EditAppointment
{
    public class EditAppointmentHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock = new();
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock = new();
        private readonly Mock<IPatientRepository> _patientRepoMock = new();
        private readonly Mock<IDentistRepository> _dentistRepoMock = new();
        private readonly Mock<IMediator> _mediatorMock = new();
        private readonly EditAppointmentHandler _handler;

        public EditAppointmentHandlerTests()
        {
            _handler = new EditAppointmentHandler(
                _appointmentRepoMock.Object,
                _mediatorMock.Object,
                _httpContextAccessorMock.Object,
                _patientRepoMock.Object,
                _dentistRepoMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
        {
            new(ClaimTypes.Role, role),
            new(ClaimTypes.NameIdentifier, userId.ToString())
        };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            var httpContext = new DefaultHttpContext { User = claimsPrincipal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);
        }

        // ✅ Normal Case
        [Fact(DisplayName = "UTCID01 - Normal - Cập nhật lịch hẹn thành công")]
        public async System.Threading.Tasks.Task UTCID01_UpdateAppointment_Success()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);

            var existAppointment = new Appointment
            {
                AppointmentId = 1,
                Status = "confirmed",
                PatientId = 3,
                DentistId = 5
            };

            var command = new EditAppointmentCommand
            {
                appointmentId = 1,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                DentistId = 7,
                ReasonForFollowUp = "Đau nhức răng"
            };

            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(existAppointment);

            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(7))
                .ReturnsAsync(new Dentist { DentistId = 7, User = new User { UserID = 77 } });

            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(5))
                .ReturnsAsync(new Dentist { DentistId = 5, User = new User { UserID = 55 } });

            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(3))
                .ReturnsAsync(new Patient { PatientID = 3, User = new User { UserID = 33 } });

            // Tránh bị MSG89: kế hoạch điều trị đã tồn tại
            _appointmentRepoMock.Setup(r => r.GetLatestAppointmentByPatientIdAsync(3))
                .ReturnsAsync(new Appointment { Status = "canceled" });

            _appointmentRepoMock.Setup(r => r.UpdateAppointmentAsync(It.IsAny<Appointment>()))
                .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.True(result);
        }

        // 🔴 Abnormal - Not receptionist
        [Fact(DisplayName = "UTCID02 - Abnormal - Not receptionist role")]
        public async System.Threading.Tasks.Task UTCID02_Unauthorized_NotReceptionist()
        {
            SetupHttpContext("patient", 10);

            var command = new EditAppointmentCommand();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(command, default));
        }

        // 🔴 Abnormal - Appointment not found
        [Fact(DisplayName = "UTCID03 - Abnormal - Appointment not found")]
        public async System.Threading.Tasks.Task UTCID03_Appointment_Not_Found()
        {
            SetupHttpContext("receptionist", 1);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(999)).ReturnsAsync((Appointment)null);

            var command = new EditAppointmentCommand { appointmentId = 999 };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        // 🔴 Abnormal - Appointment not confirmed
        [Fact(DisplayName = "UTCID04 - Abnormal - Appointment status invalid")]
        public async System.Threading.Tasks.Task UTCID04_Appointment_Not_Confirmed()
        {
            SetupHttpContext("receptionist", 1);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(new Appointment { Status = "pending" });

            var command = new EditAppointmentCommand { appointmentId = 1 };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal("Lịch hẹn đang ở trạng thái không thể thay đổi", ex.Message);
        }

        // 🔴 Abnormal - AppointmentDate < Today
        [Fact(DisplayName = "UTCID05 - Abnormal - AppointmentDate in past")]
        public async System.Threading.Tasks.Task UTCID05_AppointmentDate_In_The_Past()
        {
            SetupHttpContext("receptionist", 1);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(new Appointment { Status = "confirmed" });

            var command = new EditAppointmentCommand
            {
                appointmentId = 1,
                AppointmentDate = DateTime.Today.AddDays(-1),
                AppointmentTime = DateTime.Now.TimeOfDay
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        // 🔴 Abnormal - AppointmentTime < Now (today)
        [Fact(DisplayName = "UTCID06 - Abnormal - Appointment time is in the past today")]
        public async System.Threading.Tasks.Task UTCID06_AppointmentTime_Today_In_The_Past()
        {
            SetupHttpContext("receptionist", 1);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(new Appointment { Status = "confirmed" });

            var command = new EditAppointmentCommand
            {
                appointmentId = 1,
                AppointmentDate = DateTime.Today,
                AppointmentTime = DateTime.Now.TimeOfDay.Add(TimeSpan.FromMinutes(-5))
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        // 🔴 Abnormal - Dentist not found
        [Fact(DisplayName = "UTCID07 - Abnormal - Dentist not found")]
        public async System.Threading.Tasks.Task UTCID07_Dentist_Not_Found()
        {
            SetupHttpContext("receptionist", 1);
            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1)).ReturnsAsync(new Appointment { Status = "confirmed" });
            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(It.IsAny<int>())).ReturnsAsync((Dentist)null);

            var command = new EditAppointmentCommand
            {
                appointmentId = 1,
                DentistId = 100,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0)
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            Assert.Equal("Bác sĩ không tồn tại", ex.Message);
        }

        [Fact(DisplayName = "UTCID08 - Abnormal - Kế hoạch điều trị đã tồn tại")]
        public async System.Threading.Tasks.Task UTCID08_Confirmed_TreatmentPlan_Already_Exists()
        {
            // Arrange
            SetupHttpContext("receptionist", 1);

            var existAppointment = new Appointment
            {
                AppointmentId = 1,
                Status = "confirmed",
                PatientId = 3,
                DentistId = 5
            };

            var command = new EditAppointmentCommand
            {
                appointmentId = 1,
                AppointmentDate = DateTime.Today.AddDays(1),
                AppointmentTime = new TimeSpan(10, 0, 0),
                DentistId = 5,
                ReasonForFollowUp = "test"
            };

            _appointmentRepoMock.Setup(r => r.GetAppointmentByIdAsync(1))
                .ReturnsAsync(existAppointment);

            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(5))
                .ReturnsAsync(new Dentist { DentistId = 5, User = new User { UserID = 50 } });

            _dentistRepoMock.Setup(r => r.GetDentistByDentistIdAsync(existAppointment.DentistId))
                .ReturnsAsync(new Dentist { DentistId = 5, User = new User { UserID = 50 } });

            _patientRepoMock.Setup(r => r.GetPatientByPatientIdAsync(3))
                .ReturnsAsync(new Patient { PatientID = 3, User = new User { UserID = 30 } });

            _appointmentRepoMock.Setup(r => r.GetLatestAppointmentByPatientIdAsync(3))
                .ReturnsAsync(new Appointment { Status = "confirmed" }); // Đây là điều kiện để throw

            // Act
            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(command, default));

            // Assert
            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }
    }
}
