using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.UserCommon.ViewAppointment;
using Application.Usecases.UserCommon.ViewSupplies;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.UserCommon
{
    public class ViewAppointmentHandlerTests
    {
        private readonly Mock<IAppointmentRepository> _appointmentRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewAppointmentHandler _handler;

        public ViewAppointmentHandlerTests()
        {
            _appointmentRepoMock = new Mock<IAppointmentRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new ViewAppointmentHandler(
                _appointmentRepoMock.Object,
                _httpContextAccessorMock.Object,
                null // IMapper no longer needed
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            var context = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        [Fact(DisplayName = "[UTCID01] Unauthenticated user throws UnauthorizedAccessException")]
        public async System.Threading.Tasks.Task UTCID01_Unauthenticated_Throws_UnauthorizedAccessException()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = new ClaimsPrincipal() });

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None));
        }

        [Fact(DisplayName = "[UTCID02] Patient can view own appointments")]
        public async System.Threading.Tasks.Task UTCID02_Patient_View_Own_Appointments()
        {
            int userId = 5;
            SetupHttpContext("patient", userId);

            var mockData = new List<AppointmentDTO> { new AppointmentDTO() };
            _appointmentRepoMock.Setup(r => r.GetAppointmentsByPatientIdAsync(userId)).ReturnsAsync(mockData);

            var result = await _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Single(result);
            _appointmentRepoMock.Verify(r => r.GetAppointmentsByPatientIdAsync(userId), Times.Once);
        }

        [Fact(DisplayName = "[UTCID03] Dentist can view own appointments")]
        public async System.Threading.Tasks.Task UTCID03_Dentist_View_Own_Appointments()
        {
            int userId = 10;
            SetupHttpContext("dentist", userId);

            var mockData = new List<AppointmentDTO> { new AppointmentDTO(), new AppointmentDTO() };
            _appointmentRepoMock.Setup(r => r.GetAppointmentsByDentistIdAsync(userId)).ReturnsAsync(mockData);

            var result = await _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            _appointmentRepoMock.Verify(r => r.GetAppointmentsByDentistIdAsync(userId), Times.Once);
        }

        [Fact(DisplayName = "[UTCID04] Other role (e.g., receptionist) can view all appointments")]
        public async System.Threading.Tasks.Task UTCID04_OtherRole_View_All_Appointments()
        {
            SetupHttpContext("receptionist", 3);

            var appointments = new List<AppointmentDTO>
            {
                new AppointmentDTO { AppointmentId = 1 }
            };

            _appointmentRepoMock.Setup(r => r.GetAllAppointmentAsync()).ReturnsAsync(appointments);

            var result = await _handler.Handle(new ViewAppointmentCommand(), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Single(result);
        }

        [Fact(DisplayName = "[UTCID05] No data throws exception MSG28")]
        public async System.Threading.Tasks.Task UTCID05_EmptyList_ThrowsException()
        {
            SetupHttpContext("receptionist", 99);
            _appointmentRepoMock.Setup(r => r.GetAllAppointmentAsync()).ReturnsAsync(new List<AppointmentDTO>());

            var result = await _handler.Handle(new ViewAppointmentCommand(), default);
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact(DisplayName = "[UTCID06] Null list throws exception MSG28")]
        public async System.Threading.Tasks.Task UTCID06_NullList_ThrowsException()
        {
            SetupHttpContext("dentist", 20);
            _appointmentRepoMock.Setup(r => r.GetAppointmentsByDentistIdAsync(20)).ReturnsAsync((List<AppointmentDTO>)null);

            var result = await _handler.Handle(new ViewAppointmentCommand(), default);
            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}
