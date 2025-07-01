using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ManageSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.CreateSchedule
{
    public class CreateScheduleHandleTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IScheduleRepository> _scheduleRepoMock;
        private readonly Mock<IDentistRepository> _dentistRepoMock;
        private readonly CreateScheduleHandle _handler;

        public CreateScheduleHandleTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _scheduleRepoMock = new Mock<IScheduleRepository>();
            _dentistRepoMock = new Mock<IDentistRepository>();

            _handler = new CreateScheduleHandle(
                _httpContextAccessorMock.Object,
                _scheduleRepoMock.Object,
                _dentistRepoMock.Object
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

        [Fact(DisplayName = "UTCID01 - Normal - Dentist tạo 1 lịch thành công")]
        public async System.Threading.Tasks.Task UTCID01_Dentist_Creates_Schedule_Success()
        {
            SetupHttpContext("dentist", 10);
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var today = DateTime.Today.AddDays(1);

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = today, Shift = "morning" }
        });

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.GetWeekStart(today)).Returns(today.AddDays(-((int)today.DayOfWeek)));
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, today, "morning", 0)).ReturnsAsync((Schedule)null);
            _scheduleRepoMock.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>())).ReturnsAsync(true);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG52, result);
        }

        [Fact(DisplayName = "UTCID02 - Abnormal - Không phải dentist -> bị từ chối")]
        public async System.Threading.Tasks.Task UTCID02_User_Not_Dentist_Should_Fail()
        {
            SetupHttpContext("assistant", 99);
            var today = DateTime.Today.AddDays(1);

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = today, Shift = "morning" }
        });

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG26, result);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - WorkDate trong quá khứ")]
        public async System.Threading.Tasks.Task UTCID03_Past_WorkDate_Should_Fail()
        {
            SetupHttpContext("dentist", 10);
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var yesterday = DateTime.Today.AddDays(-1);

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = yesterday, Shift = "morning" }
        });

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG34, result);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Shift bị null")]
        public async System.Threading.Tasks.Task UTCID04_Shift_Null_Should_Fail()
        {
            SetupHttpContext("dentist", 10);
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var today = DateTime.Today.AddDays(1);

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = today, Shift = null }
        });

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG07, result);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Trùng lịch pending/approved")]
        public async System.Threading.Tasks.Task UTCID05_Duplicate_Pending_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var today = DateTime.Today.AddDays(1);

            var existing = new Schedule
            {
                ScheduleId = 99,
                DentistId = 5,
                WorkDate = today,
                Shift = "morning",
                Status = "pending"
            };

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = today, Shift = "morning" }
        });

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.GetWeekStart(today)).Returns(today);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, today, "morning", 0)).ReturnsAsync(existing);

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG51, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Abnormal - Lịch bị rejected => xóa mềm và tạo mới")]
        public async System.Threading.Tasks.Task UTCID06_Rejected_Schedule_Should_Delete_Then_Create()
        {
            SetupHttpContext("dentist", 10);
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var date = DateTime.Today.AddDays(2);
            var rejected = new Schedule
            {
                ScheduleId = 100,
                DentistId = 5,
                WorkDate = date,
                Shift = "afternoon",
                Status = "rejected"
            };

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = date, Shift = "afternoon" }
        });

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.GetWeekStart(date)).Returns(date);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, date, "afternoon", 0)).ReturnsAsync(rejected);
            _scheduleRepoMock.Setup(r => r.DeleteSchedule(100)).ReturnsAsync(true);
            _scheduleRepoMock.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>())).ReturnsAsync(true);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG52, result);
            _scheduleRepoMock.Verify(x => x.DeleteSchedule(100), Times.Once);
        }

        [Fact(DisplayName = "UTCID07 - Abnormal - Đăng ký lịch thất bại")]
        public async System.Threading.Tasks.Task UTCID07_Create_Failed_Should_Return_Failure_Message()
        {
            SetupHttpContext("dentist", 10);
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var date = DateTime.Today.AddDays(2);

            var command = new CreateScheduleCommand(new List<CreateScheduleDTO>
        {
            new() { WorkDate = date, Shift = "evening" }
        });

            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.GetWeekStart(date)).Returns(date);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, date, "evening", 0)).ReturnsAsync((Schedule)null);
            _scheduleRepoMock.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>())).ReturnsAsync(false);

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG73, result);
        }
    }
}
