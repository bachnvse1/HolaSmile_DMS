using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.ViewDentistSchedule
{
    public class ViewAllDentistScheduleHandlerTests
    {
        private readonly Mock<IScheduleRepository> _scheduleRepo = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly ViewAllDentistSchedulehandler _handler;

        public ViewAllDentistScheduleHandlerTests()
        {
            _handler = new ViewAllDentistSchedulehandler(_scheduleRepo.Object, _httpContextAccessor.Object);
        }

        private void SetupContext(string? role, string userId = "1")
        {
            var claims = new List<Claim>();
            if (role != null)
                claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "ITCID01 - Owner requests → return all schedules grouped by dentist")]
        public async System.Threading.Tasks.Task ITCID01_Owner_ReturnsGroupedSchedules()
        {
            SetupContext("owner");

            var schedules = new List<Schedule>
        {
            new Schedule
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today,
                Shift = "morning",
                Status = "approved",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                DentistId = 10,
                Dentist = new global::Dentist
                {
                    DentistId = 10,
                    User = new User { Fullname = "Dr. A", Avatar = "avatar.png" }
                }
            }
        };

            _scheduleRepo.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync(schedules);

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            Assert.Single(result);
            Assert.Equal(10, result[0].DentistID);
            Assert.Equal("Dr. A", result[0].DentistName);
            Assert.Single(result[0].Schedules);
        }

        [Fact(DisplayName = "UTCID02 - Patient requests → return available schedules grouped by dentist")]
        public async System.Threading.Tasks.Task ITCID02_Patient_ReturnsAvailableSchedules()
        {
            SetupContext("patient");

            var schedules = new List<Schedule>
        {
            new Schedule
            {
                ScheduleId = 2,
                WorkDate = DateTime.Today,
                Shift = "afternoon",
                Status = "approved",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                DentistId = 20,
                Dentist = new global::Dentist
                {
                    DentistId = 20,
                    User = new User { Fullname = "Dr. B", Avatar = "avatar2.png" }
                }
            }
        };

            _scheduleRepo.Setup(r => r.GetAllAvailableDentistSchedulesAsync(3)).ReturnsAsync(schedules);

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            Assert.Single(result);
            Assert.Equal(20, result[0].DentistID);
            Assert.Equal("Dr. B", result[0].DentistName);
            Assert.Single(result[0].Schedules);
        }

        [Fact(DisplayName = "UTCID03 - No schedule found → throw MSG28")]
        public async System.Threading.Tasks.Task ITCID03_EmptySchedules_ThrowsMSG28()
        {
            SetupContext("owner");
            _scheduleRepo.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync(new List<Schedule>());

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new ViewAllDentistScheduleCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }
    }
}
