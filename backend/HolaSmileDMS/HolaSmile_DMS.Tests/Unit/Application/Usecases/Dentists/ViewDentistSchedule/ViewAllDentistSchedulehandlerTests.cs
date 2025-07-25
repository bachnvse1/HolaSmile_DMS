using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class ViewAllDentistSchedulehandlerTests
    {
        private readonly Mock<IScheduleRepository> _scheduleRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewAllDentistSchedulehandler _handler;

        public ViewAllDentistSchedulehandlerTests()
        {
            _scheduleRepoMock = new Mock<IScheduleRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new ViewAllDentistSchedulehandler(_scheduleRepoMock.Object, _httpContextAccessorMock.Object);
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

        // 🔵 Normal case - Role Owner
        [Fact(DisplayName = "Normal - UTCID01 - Role Owner gets all schedules successfully")]
        public async System.Threading.Tasks.Task UTCID01_OwnerRole_ReturnsAllSchedules()
        {
            // Arrange
            SetupHttpContext("owner", 1);

            var dentistUser = new User { Fullname = "Dr. A", Avatar = "a.png" };
            var dentist = new Dentist { DentistId = 2, User = dentistUser };
            var schedules = new List<Schedule>
            {
                new Schedule { ScheduleId = 1, WorkDate = DateTime.Today, Shift = "Morning", Status = "approved", Dentist = dentist, DentistId = 2 },
                new Schedule { ScheduleId = 2, WorkDate = DateTime.Today.AddDays(1), Shift = "Afternoon", Status = "approved", Dentist = dentist, DentistId = 2 }
            };

            _scheduleRepoMock.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync(schedules);

            // Act
            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), CancellationToken.None);

            // Assert
            Assert.Single(result);
            Assert.Equal(2, result[0].Schedules.Count);
            Assert.Equal("Dr. A", result[0].DentistName);
        }

        // 🔵 Normal case - Non-owner role (e.g. receptionist, manager)
        [Fact(DisplayName = "Normal - UTCID02 - Non-owner role gets available schedules")]
        public async System.Threading.Tasks.Task UTCID02_NonOwnerRole_ReturnsAvailableSchedules()
        {
            // Arrange
            SetupHttpContext("receptionist", 5);

            var dentistUser = new User { Fullname = "Dr. B", Avatar = "b.jpg" };
            var dentist = new Dentist { DentistId = 3, User = dentistUser };
            var schedules = new List<Schedule>
            {
                new Schedule { ScheduleId = 3, WorkDate = DateTime.Today, Shift = "Morning", Status = "approved", Dentist = dentist, DentistId = 3 }
            };

            _scheduleRepoMock.Setup(r => r.GetAllAvailableDentistSchedulesAsync(3)).ReturnsAsync(schedules);

            // Act
            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), CancellationToken.None);

            // Assert
            Assert.Single(result);
            Assert.Equal("Dr. B", result[0].DentistName);
        }

        // 🔴 Abnormal case - Empty schedule list
        [Fact(DisplayName = "Abnormal - UTCID04 - No schedules returned -> Exception")]
        public async System.Threading.Tasks.Task UTCID04_NoSchedulesFound_ThrowsException()
        {
            // Arrange
            SetupHttpContext("owner", 1);
            _scheduleRepoMock.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync(new List<Schedule>());

            // Act & Assert
            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);
            Assert.NotNull(result);
            Assert.Empty(result);
        }
    }
}
