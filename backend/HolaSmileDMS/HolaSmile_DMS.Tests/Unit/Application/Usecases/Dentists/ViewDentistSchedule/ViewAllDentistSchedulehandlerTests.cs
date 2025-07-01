using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.ViewDentistSchedule
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
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }));

            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "UTCID01 - Normal - Dentist xem toàn bộ lịch của mình")]
        public async System.Threading.Tasks.Task UTCID01_Dentist_Can_View_All_Schedules()
        {
            // Arrange
            SetupHttpContext("dentist", 2);
            var schedules = new List<Schedule>
        {
            new Schedule
            {
                ScheduleId = 1,
                DentistId = 2,
                WorkDate = DateTime.Today,
                Shift = "morning",
                Status = "approved",
                CreatedAt = DateTime.Now.AddDays(-1),
                UpdatedAt = DateTime.Now,
                Dentist = new Dentist
                {
                    DentistId = 2,
                    User = new User { Fullname = "Dr. A", Avatar = "avatar.png" }
                }
            }
        };

            _scheduleRepoMock.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync(schedules);

            // Act
            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            // Assert
            Assert.Single(result);
            Assert.Equal(2, result[0].DentistID);
            Assert.Equal("Dr. A", result[0].DentistName);
        }

        [Fact(DisplayName = "UTCID02 - Normal - Owner cũng được xem toàn bộ lịch")]
        public async System.Threading.Tasks.Task UTCID02_Owner_Can_View_All_Schedules()
        {
            // Arrange
            SetupHttpContext("owner", 1);
            _scheduleRepoMock.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync(new List<Schedule>());

            // Act
            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            // Assert
            _scheduleRepoMock.Verify(x => x.GetAllDentistSchedulesAsync(), Times.Once);
            Assert.Empty(result);
        }

        [Fact(DisplayName = "UTCID03 - Normal - Assistant chỉ xem lịch khả dụng (limit 3)")]
        public async System.Threading.Tasks.Task UTCID03_Assistant_Can_View_Limited_Available_Schedules()
        {
            // Arrange
            SetupHttpContext("assistant", 5);
            _scheduleRepoMock.Setup(r => r.GetAllAvailableDentistSchedulesAsync(3)).ReturnsAsync(new List<Schedule>());

            // Act
            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            // Assert
            _scheduleRepoMock.Verify(x => x.GetAllAvailableDentistSchedulesAsync(3), Times.Once);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Không có HttpContext")]
        public async System.Threading.Tasks.Task UTCID04_Abnormal_NoHttpContext_ShouldThrow()
        {
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);

            await Assert.ThrowsAsync<NullReferenceException>(() =>
                _handler.Handle(new ViewAllDentistScheduleCommand(), default));
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Không có Claim Role hoặc UserId")]
        public async System.Threading.Tasks.Task UTCID05_Abnormal_MissingClaims()
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity([]));
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new ViewAllDentistScheduleCommand(), default));
        }
    }
}
