using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Owner;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Owners
{
    public class ApproveScheduleHandleTest
    {
        private readonly Mock<IScheduleRepository> _scheduleRepositoryMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly ApproveScheduleHandle _handler;
        public ApproveScheduleHandleTest()
        {
            _scheduleRepositoryMock = new Mock<IScheduleRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _handler = new ApproveScheduleHandle(_scheduleRepositoryMock.Object, _httpContextAccessorMock.Object);
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

        [Fact(DisplayName = "[Unit - Abnormal] Role_Not_Owner_Throws_Unauthorized")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task Role_Not_Owner_Throws_Unauthorized()
        {
            SetupHttpContext("receptionist", 1);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(cmd, CancellationToken.None));
        }

        [Fact(DisplayName = "[Unit - Abnormal] Schedule_NotFound_Throws_Exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task Schedule_NotFound_Throws_Exception()
        {
            SetupHttpContext("owner", 1);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 99 }, Action = "approved" };

            _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(99)).ReturnsAsync((Schedule)null);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, CancellationToken.None));
            Assert.Equal("Chỉ có thể cập nhật lịch đang ở trạng thái pending", ex.Message);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Schedule_NotPending_Throws_Exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task Schedule_NotPending_Throws_Exception()
        {
            SetupHttpContext("owner", 1);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 5 }, Action = "approved" };

            var schedule = new Schedule { ScheduleId = 5, Status = "approved" };
            _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(5)).ReturnsAsync(schedule);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, CancellationToken.None));
            Assert.Equal("Chỉ có thể cập nhật lịch đang ở trạng thái pending", ex.Message);
        }

        [Fact(DisplayName = "[Unit - Abnormal] Update_Failed_Throws_Exception")]
        [Trait("TestType", "Abnormal")]
        public async System.Threading.Tasks.Task Update_Failed_Throws_Exception()
        {
            SetupHttpContext("owner", 1);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 3 }, Action = "approved" };

            var schedule = new Schedule { ScheduleId = 3, Status = "pending" };
            _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(3)).ReturnsAsync(schedule);
            _scheduleRepositoryMock.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(false);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(cmd, CancellationToken.None));
            Assert.Equal("Cập nhật lịch làm việc không thành công", ex.Message);
        }

        [Fact(DisplayName = "[Unit - Normal] Approve_Single_Schedule_Success")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task Approve_Single_Schedule_Success()
        {
            SetupHttpContext("owner", 10);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            var schedule = new Schedule { ScheduleId = 1, Status = "pending" };
            _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _scheduleRepositoryMock.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG80, result);
            Assert.Equal("approved", schedule.Status);
            Assert.Equal(10, schedule.UpdatedBy);
        }

        [Fact(DisplayName = "[Unit - Normal] Reject_Single_Schedule_Success")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task Reject_Single_Schedule_Success()
        {
            SetupHttpContext("owner", 10);
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 2 }, Action = "rejected" };

            var schedule = new Schedule { ScheduleId = 2, Status = "pending" };
            _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(2)).ReturnsAsync(schedule);
            _scheduleRepositoryMock.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG81, result);
            Assert.Equal("rejected", schedule.Status);
            Assert.Equal(10, schedule.UpdatedBy);
        }

        [Fact(DisplayName = "[Unit - Normal] Approve_List_Schedules_Success")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task Approve_List_Schedules_Success()
        {
            SetupHttpContext("owner", 20);
            var scheduleIds = new List<int> { 1, 2, 3 };
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = scheduleIds, Action = "approved" };

            foreach (var id in scheduleIds)
            {
                var schedule = new Schedule { ScheduleId = id, Status = "pending" };
                _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(id)).ReturnsAsync(schedule);
                _scheduleRepositoryMock.Setup(r => r.UpdateScheduleAsync(It.Is<Schedule>(s => s.ScheduleId == id)))
                                       .ReturnsAsync(true);
            }

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG80, result);
        }

        [Fact(DisplayName = "[Unit - Normal] Reject_List_Schedules_Success")]
        [Trait("TestType", "Normal")]
        public async System.Threading.Tasks.Task Reject_List_Schedules_Success()
        {
            SetupHttpContext("owner", 30);
            var scheduleIds = new List<int> { 10, 11 };
            var cmd = new ApproveDentistScheduleCommand { ScheduleIds = scheduleIds, Action = "rejected" };

            foreach (var id in scheduleIds)
            {
                var schedule = new Schedule { ScheduleId = id, Status = "pending" };
                _scheduleRepositoryMock.Setup(r => r.GetScheduleByIdAsync(id)).ReturnsAsync(schedule);
                _scheduleRepositoryMock.Setup(r => r.UpdateScheduleAsync(It.Is<Schedule>(s => s.ScheduleId == id)))
                                       .ReturnsAsync(true);
            }

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG81, result);
        }
    }
}
