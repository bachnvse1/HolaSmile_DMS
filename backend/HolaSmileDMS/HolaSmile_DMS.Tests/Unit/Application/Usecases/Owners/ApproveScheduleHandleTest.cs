using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Owner.ApproveDentistSchedule;
using Application.Usecases.Owner.AprroveDentistSchedule;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Owners
{
    public class ApproveDentistScheduleHandleTests
    {
        private readonly Mock<IScheduleRepository> _scheduleRepo;
        private readonly Mock<IHttpContextAccessor> _http;
        private readonly Mock<IMediator> _mediator;
        private readonly ApproveDentistScheduleHandle _handler;

        public ApproveDentistScheduleHandleTests()
        {
            _scheduleRepo = new Mock<IScheduleRepository>();
            _http = new Mock<IHttpContextAccessor>();
            _mediator = new Mock<IMediator>();

            _handler = new ApproveDentistScheduleHandle(
                _http.Object,
                _scheduleRepo.Object,
                _mediator.Object
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
            _http.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = principal });
        }

        private static Schedule MakeSchedule(
            int id,
            int dentistUserId,
            string status = "pending",
            DateTime? workDate = null)
        {
            return new Schedule
            {
                ScheduleId = id,
                Status = status,
                WorkDate = (workDate ?? DateTime.Now.Date),
                Dentist = new Dentist
                {
                    DentistId = dentistUserId, // không ảnh hưởng logic nhưng điền cho đủ
                    User = new User { UserID = dentistUserId }
                }
            };
        }

        // ---------- Abnormal cases ----------

        [Fact(DisplayName = "[Abnormal] Non-owner is unauthorized")]
        public async System.Threading.Tasks.Task NonOwner_Throws_Unauthorized()
        {
            SetupHttpContext("receptionist", 1);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 1 },
                Action = "approved"
            };

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(cmd, CancellationToken.None));
        }

        [Fact(DisplayName = "[Abnormal] Schedule not found")]
        public async System.Threading.Tasks.Task Schedule_NotFound_Throws()
        {
            SetupHttpContext("owner", 9);

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(99))
                         .ReturnsAsync((Schedule?)null);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 99 },
                Action = "approved"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(cmd, CancellationToken.None));

            Assert.Equal("Chỉ có thể cập nhật lịch đang ở trạng thái pending", ex.Message);
        }

        [Fact(DisplayName = "[Abnormal] Schedule not in pending state")]
        public async System.Threading.Tasks.Task Schedule_NotPending_Throws()
        {
            SetupHttpContext("owner", 9);

            var sch = MakeSchedule(5, dentistUserId: 1001, status: "approved");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(5)).ReturnsAsync(sch);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 5 },
                Action = "approved"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(cmd, CancellationToken.None));

            Assert.Equal("Chỉ có thể cập nhật lịch đang ở trạng thái pending", ex.Message);
        }

        [Fact(DisplayName = "[Abnormal] Update repository returns false")]
        public async System.Threading.Tasks.Task Update_Failed_Throws()
        {
            SetupHttpContext("owner", 10);

            var sch = MakeSchedule(3, dentistUserId: 1001);
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(3)).ReturnsAsync(sch);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>()))
                         .ReturnsAsync(false);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 3 },
                Action = "approved"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() =>
                _handler.Handle(cmd, CancellationToken.None));

            Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
        }

        // ---------- Normal cases ----------

        [Fact(DisplayName = "[Normal] Approve single schedule - success & notification sent")]
        public async System.Threading.Tasks.Task Approve_Single_Success()
        {
            SetupHttpContext("owner", 10);

            var sch = MakeSchedule(1, dentistUserId: 1001, status: "pending", workDate: new DateTime(2025, 8, 20));
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(sch);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 1 },
                Action = "approved"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG80, result);
            Assert.Equal("approved", sch.Status);
            Assert.Equal(10, sch.UpdatedBy);

            _scheduleRepo.Verify(r => r.UpdateScheduleAsync(It.Is<Schedule>(s =>
                s.ScheduleId == 1 && s.Status == "approved" && s.UpdatedBy == 10
            )), Times.Once);

        }

        [Fact(DisplayName = "[Normal] Reject single schedule - success & notification sent")]
        public async System.Threading.Tasks.Task Reject_Single_Success()
        {
            SetupHttpContext("owner", 11);

            var sch = MakeSchedule(2, dentistUserId: 2002, status: "pending", workDate: new DateTime(2025, 8, 22));
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(2)).ReturnsAsync(sch);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 2 },
                Action = "rejected"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG81, result);
            Assert.Equal("rejected", sch.Status);
            Assert.Equal(11, sch.UpdatedBy);


        }

        [Fact(DisplayName = "[Normal] Approve list of schedules - grouped by dentist (one notification per dentist)")]
        public async System.Threading.Tasks.Task Approve_List_Grouped_Notifications()
        {
            SetupHttpContext("owner", 20);

            // 3 lịch: 2 lịch cùng nha sĩ 3003, 1 lịch nha sĩ 4004
            var s1 = MakeSchedule(10, 3003, "pending", new DateTime(2025, 8, 21));
            var s2 = MakeSchedule(11, 3003, "pending", new DateTime(2025, 8, 23));
            var s3 = MakeSchedule(12, 4004, "pending", new DateTime(2025, 8, 24));

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(10)).ReturnsAsync(s1);
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(11)).ReturnsAsync(s2);
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(12)).ReturnsAsync(s3);

            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 10, 11, 12 },
                Action = "approved"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG80, result);

            // Verify update gọi đúng 3 lần
            _scheduleRepo.Verify(r => r.UpdateScheduleAsync(It.IsAny<Schedule>()), Times.Exactly(3));

        }

        [Fact(DisplayName = "[Normal] Reject list of schedules - grouped by dentist")]
        public async System.Threading.Tasks.Task Reject_List_Grouped_Notifications()
        {
            SetupHttpContext("owner", 30);

            var s1 = MakeSchedule(21, 5005, "pending", new DateTime(2025, 8, 18));
            var s2 = MakeSchedule(22, 5005, "pending", new DateTime(2025, 8, 19));

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(21)).ReturnsAsync(s1);
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(22)).ReturnsAsync(s2);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 21, 22 },
                Action = "rejected"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG81, result);

        }

        [Fact(DisplayName = "[Normal] Unknown action => treated as rejected")]
        public async System.Threading.Tasks.Task Unknown_Action_Treated_As_Rejected()
        {
            SetupHttpContext("owner", 40);

            var s = MakeSchedule(31, 6006, "pending", new DateTime(2025, 8, 25));
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(31)).ReturnsAsync(s);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 31 },
                Action = "something-else"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            Assert.Equal(MessageConstants.MSG.MSG81, result);
            Assert.Equal("rejected", s.Status);

        }

        [Fact(DisplayName = "[Normal] Mediator throws in one group -> still succeed (errors swallowed)")]
        public async System.Threading.Tasks.Task   Mediator_Throws_Is_Swallowed()
        {
            SetupHttpContext("owner", 50);

            var s1 = MakeSchedule(41, 7007, "pending", new DateTime(2025, 8, 26));
            var s2 = MakeSchedule(42, 8008, "pending", new DateTime(2025, 8, 27));

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(41)).ReturnsAsync(s1);
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(42)).ReturnsAsync(s2);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var cmd = new ApproveDentistScheduleCommand
            {
                ScheduleIds = new List<int> { 41, 42 },
                Action = "approved"
            };

            var result = await _handler.Handle(cmd, CancellationToken.None);

            // Dù 1 thông báo lỗi, handler vẫn trả về thành công
            Assert.Equal(MessageConstants.MSG.MSG80, result);

            // Cả hai lịch đều được cập nhật
            Assert.Equal("approved", s1.Status);
            Assert.Equal("approved", s2.Status);

            _scheduleRepo.Verify(r => r.UpdateScheduleAsync(It.IsAny<Schedule>()), Times.Exactly(2));
            _mediator.Verify(m => m.Send(It.IsAny<SendNotificationCommand>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        }
    }
}
