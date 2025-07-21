using System.Security.Claims;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewDetailAppointmentHandlerTests
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IUserCommonRepository> _userCommonRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly ViewDetailAppointmentHandler _handler;

        public ViewDetailAppointmentHandlerTests()
        {
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _userCommonRepoMock = new Mock<IUserCommonRepository>();
            _mapperMock = new Mock<IMapper>();
            _handler = new ViewDetailAppointmentHandler(
                _appointmentRepoMock.Object,
                _userCommonRepoMock.Object,
                _mapperMock.Object,
                _httpContextAccessorMock.Object
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
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "UTCID01 - Patient can view own appointment")]
        public async System.Threading.Tasks.Task Patient_Can_View_Appointment()
        {
            // Arrange
            int patientId = 1, appointmentId = 10;
            SetupHttpContext("patient", patientId);

            _appointmentRepoMock
                .Setup(r => r.CheckPatientAppointmentByUserIdAsync(appointmentId, patientId))
                .ReturnsAsync(true);

            // Fake CreatedBy / UpdatedBy as string userId
            var appointment = new AppointmentDTO
            {
                AppointmentId = appointmentId,
                CreatedBy = "2",
                UpdatedBy = "3"
            };

            _appointmentRepoMock
                .Setup(r => r.GetDetailAppointmentByAppointmentIDAsync(appointmentId))
                .ReturnsAsync(appointment);

            // Mock created user
            _userCommonRepoMock
                .Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserID = 2,Phone ="0999999999", Fullname = "Alice Created" });

            // Mock updated user
            _userCommonRepoMock
                .Setup(r => r.GetByIdAsync(3, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserID = 3, Phone = "0999999998", Fullname = "Bob Updated" });

            var command = new ViewDetailAppointmentCommand(appointmentId);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.AppointmentId);
            Assert.Equal("Alice Created", result.CreatedBy);
        }


        [Fact(DisplayName = "UTCID02 - Dentist can view own appointment")]
        public async System.Threading.Tasks.Task Dentist_Can_View_Appointment()
        {
            // Arrange
            int dentistId = 2, appointmentId = 11;
            SetupHttpContext("dentist", dentistId);

            _appointmentRepoMock
                .Setup(r => r.CheckDentistAppointmentByUserIdAsync(appointmentId, dentistId))
                .ReturnsAsync(true);

            var appointment = new AppointmentDTO
            {
                AppointmentId = appointmentId,
                CreatedBy = "4",
                UpdatedBy = "5"
            };

            _appointmentRepoMock
                .Setup(r => r.GetDetailAppointmentByAppointmentIDAsync(appointmentId))
                .ReturnsAsync(appointment);

            _userCommonRepoMock
                .Setup(r => r.GetByIdAsync(4, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserID = 4, Fullname = "Dr. Created" });

            _userCommonRepoMock
                .Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserID = 5, Fullname = "Dr. Updated" });

            var command = new ViewDetailAppointmentCommand(appointmentId);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(appointmentId, result.AppointmentId);
        }


        [Fact(DisplayName = "UTCID03 - Patient accesses unauthorized appointment throws exception")]
        public async System.Threading.Tasks.Task Patient_Access_Unauthorized_Throws()
        {
            int patientId = 3, appointmentId = 20;
            SetupHttpContext("patient", patientId);

            _appointmentRepoMock
                .Setup(r => r.CheckPatientAppointmentByUserIdAsync(appointmentId, patientId))
                .ReturnsAsync(false);

            var command = new ViewDetailAppointmentCommand(appointmentId);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "UTCID04 - Dentist accesses unauthorized appointment throws exception")]
        public async System.Threading.Tasks.Task Dentist_Access_Unauthorized_Throws()
        {
            int dentistId = 4, appointmentId = 21;
            SetupHttpContext("dentist", dentistId);

            _appointmentRepoMock
                .Setup(r => r.CheckDentistAppointmentByUserIdAsync(appointmentId, dentistId))
                .ReturnsAsync(false);

            var command = new ViewDetailAppointmentCommand(appointmentId);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }

        [Fact(DisplayName = "UTCID05 - Appointment not found throws exception")]
        public async System.Threading.Tasks.Task Appointment_Not_Found_Throws()
        {
            int receptionistId = 5, appointmentId = 22;
            SetupHttpContext("receptionist", receptionistId);

            _appointmentRepoMock
                .Setup(r => r.GetDetailAppointmentByAppointmentIDAsync(appointmentId))
                .ReturnsAsync((AppointmentDTO)null);

            var command = new ViewDetailAppointmentCommand(appointmentId);

            await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
        }
    }
}
