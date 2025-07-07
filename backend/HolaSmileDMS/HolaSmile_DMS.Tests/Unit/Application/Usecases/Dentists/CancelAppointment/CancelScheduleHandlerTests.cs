using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.CancelSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists
{
    public class CancelScheduleHandlerTests
    {
        private readonly Mock<IDentistRepository> _dentistRepoMock;
        private readonly Mock<IScheduleRepository> _scheduleRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly CancelScheduleHandler _handler;

        public CancelScheduleHandlerTests()
        {
            _dentistRepoMock = new Mock<IDentistRepository>();
            _scheduleRepoMock = new Mock<IScheduleRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new CancelScheduleHandler(
                _dentistRepoMock.Object,
                _scheduleRepoMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        private void SetupHttpContext(string role, int userId)
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }));
            _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "UTCID01 - Normal - Dentist hủy lịch trạng thái pending thành công")]
        public async System.Threading.Tasks.Task UTCID01_Dentist_Cancel_Pending_Schedule_Success()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.DeleteSchedule(1)).ReturnsAsync(true);

            var command = new CancelScheduleCommand { ScheduleId = 1 };
            var result = await _handler.Handle(command, default);

            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID02 - Abnormal - Lịch không tồn tại")]
        public async System.Threading.Tasks.Task UTCID02_Schedule_Not_Found_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(999)).ReturnsAsync((Schedule)null);

            var command = new CancelScheduleCommand { ScheduleId = 999 };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - Không phải dentist")]
        public async System.Threading.Tasks.Task UTCID03_Not_Dentist_Should_Throw()
        {
            SetupHttpContext("assistant", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);

            var command = new CancelScheduleCommand { ScheduleId = 1 };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Dentist không sở hữu lịch")]
        public async System.Threading.Tasks.Task UTCID04_Dentist_Not_Owner_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            var dentist = new Dentist { DentistId = 999, UserId = 10 };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);

            var command = new CancelScheduleCommand { ScheduleId = 1 };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Lịch đã được duyệt, không thể hủy")]
        public async System.Threading.Tasks.Task UTCID05_Approved_Schedule_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "approved" };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);

            var command = new CancelScheduleCommand { ScheduleId = 1 };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal("Lịch làm việc đã được duyệt, không thể chỉnh sửa.", ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Abnormal - Hủy thất bại do DeleteSchedule trả về false")]
        public async System.Threading.Tasks.Task UTCID06_Delete_Failed_Should_Return_False()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.DeleteSchedule(1)).ReturnsAsync(false);

            var command = new CancelScheduleCommand { ScheduleId = 1 };
            var result = await _handler.Handle(command, default);

            Assert.False(result);
        }
    }
}
