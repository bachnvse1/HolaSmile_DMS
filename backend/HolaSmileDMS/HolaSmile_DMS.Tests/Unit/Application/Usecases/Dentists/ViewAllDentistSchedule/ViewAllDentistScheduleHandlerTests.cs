using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ViewDentistSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class ViewAllDentistScheduleHandlerTests
    {
        private readonly Mock<IScheduleRepository> _scheduleRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ViewAllDentistSchedulehandler _handler;

        public ViewAllDentistScheduleHandlerTests()
        {
            _scheduleRepositoryMock = new Mock<IScheduleRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new ViewAllDentistSchedulehandler(_scheduleRepositoryMock.Object, _httpContextAccessorMock.Object);
        }

        private void SetupHttpContext(string role, int userId)
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var principal = new ClaimsPrincipal(identity);

            var context = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(context);
        }

        // ✅ Normal: Role = "owner", có schedule
        [Fact(DisplayName = "[Unit - Normal] Owner_View_All_Schedules_Success")]
        public async System.Threading.Tasks.Task U01_Owner_View_All_Schedules_Success()
        {
            SetupHttpContext("owner", 1);
            _scheduleRepositoryMock.Setup(r => r.GetAllDentistSchedulesAsync())
                .ReturnsAsync(new List<Schedule>
                {
                new Schedule
                {
                    DentistId = 1,
                    WorkDate = DateTime.Today,
                    Shift = "morning",
                    Status = "approved",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    Dentist = new Dentist { User = new User { Fullname = "Dr. A", Avatar = "img.png" } }
                }
                });

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            Assert.Single(result);
            Assert.Equal("Dr. A", result[0].DentistName);
        }

        // ✅ Normal: Role != owner (e.g. guest), lấy lịch rảnh
        [Fact(DisplayName = "[Unit - Normal] Guest_View_Available_Schedules_Success")]
        public async System.Threading.Tasks.Task U02_Guest_View_Available_Schedules_Success()
        {
            SetupHttpContext("guest", 2);
            _scheduleRepositoryMock.Setup(r => r.GetAllAvailableDentistSchedulesAsync(3))
                .ReturnsAsync(new List<Schedule>
                {
                new Schedule
                {
                    DentistId = 2,
                    WorkDate = DateTime.Today,
                    Shift = "afternoon",
                    Status = "pending",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now,
                    Dentist = new Dentist { User = new User { Fullname = "Dr. B", Avatar = "img2.png" } }
                }
                });

            var result = await _handler.Handle(new ViewAllDentistScheduleCommand(), default);

            Assert.Single(result);
            Assert.Equal("Dr. B", result[0].DentistName);
        }

        // 🔴 Abnormal: Không có lịch
        [Fact(DisplayName = "[Unit - Abnormal] No_Schedules_Throws_Exception")]
        public async System.Threading.Tasks.Task U04_No_Schedules_Throws_Exception()
        {
            SetupHttpContext("owner", 1);
            _scheduleRepositoryMock.Setup(r => r.GetAllDentistSchedulesAsync())
                                   .ReturnsAsync(new List<Schedule>());

            var cmd = new ViewAllDentistScheduleCommand();

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        // 🔴 Abnormal: Role hợp lệ nhưng repo trả về null
        [Fact(DisplayName = "[Unit - Abnormal] Repo_Returns_Null_Schedules_Throws_Exception")]
        public async System.Threading.Tasks.Task U05_Repo_Returns_Null_Schedules_Throws_Exception()
        {
            SetupHttpContext("owner", 1);
            _scheduleRepositoryMock.Setup(r => r.GetAllDentistSchedulesAsync()).ReturnsAsync((List<Schedule>)null);

            var cmd = new ViewAllDentistScheduleCommand();

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, default));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }
    }
}
