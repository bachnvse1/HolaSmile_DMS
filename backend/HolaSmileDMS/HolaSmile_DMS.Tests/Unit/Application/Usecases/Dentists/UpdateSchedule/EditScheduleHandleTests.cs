using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.UpdateSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Unit.Application.Usecases.Dentists.UpdateSchedule
{
    public class EditScheduleHandleTests
    {
        private readonly Mock<IDentistRepository> _dentistRepoMock;
        private readonly Mock<IScheduleRepository> _scheduleRepoMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly EditScheduleHandle _handler;

        public EditScheduleHandleTests()
        {
            _dentistRepoMock = new Mock<IDentistRepository>();
            _scheduleRepoMock = new Mock<IScheduleRepository>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            _handler = new EditScheduleHandle(
                _dentistRepoMock.Object,
                _scheduleRepoMock.Object,
                _httpContextAccessorMock.Object
            );
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

        [Fact(DisplayName = "UTCID01 - Normal - Dentist cập nhật lịch thành công")]
        public async System.Threading.Tasks.Task UTCID01_Dentist_Can_Update_Schedule_Success()
        {
            // Arrange
            SetupHttpContext("dentist", 10);
            var date = DateTime.Today.AddDays(1);
            var schedule = new Schedule
            {
                ScheduleId = 1,
                DentistId = 5,
                WorkDate = DateTime.Today,
                Shift = "morning",
                Status = "pending"
            };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };

            var command = new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = date,
                Shift = "afternoon"
            };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, date, "afternoon", 1)).ReturnsAsync((Schedule)null);
            _scheduleRepoMock.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, default);

            // Assert
            Assert.True(result);
        }

        [Fact(DisplayName = "UTCID02 - Abnormal - Lịch không tồn tại")]
        public async System.Threading.Tasks.Task UTCID02_Schedule_Not_Found_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(999)).ReturnsAsync((Schedule)null);

            var command = new EditScheduleCommand
            {
                ScheduleId = 999,
                WorkDate = DateTime.Today.AddDays(1),
                Shift = "afternoon"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Abnormal - Không phải dentist")]
        public async System.Threading.Tasks.Task UTCID03_User_Not_Dentist_Should_Throw()
        {
            SetupHttpContext("assistant", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);

            var command = new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today,
                Shift = "morning"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Abnormal - Dentist không sở hữu lịch")]
        public async System.Threading.Tasks.Task UTCID04_Dentist_Not_Owner_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            var dentist = new Dentist { DentistId = 99, UserId = 10 }; // không khớp

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);

            var command = new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today,
                Shift = "morning"
            };

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Abnormal - Lịch đã được duyệt")]
        public async System.Threading.Tasks.Task UTCID05_Schedule_Already_Approved_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "approved" };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);

            var command = new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today,
                Shift = "evening"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal("Lịch làm việc đã được duyệt, không thể chỉnh sửa.", ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Abnormal - Trùng lịch pending/approved")]
        public async System.Threading.Tasks.Task UTCID06_Duplicate_Approved_Should_Throw()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var duplicate = new Schedule { ScheduleId = 2, Status = "approved" };

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, It.IsAny<DateTime>(), It.IsAny<string>(), 1)).ReturnsAsync(duplicate);

            var command = new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = DateTime.Today.AddDays(1),
                Shift = "afternoon"
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }

        [Fact(DisplayName = "UTCID07 - Normal - Trùng rejected => xóa mềm & cập nhật")]
        public async System.Threading.Tasks.Task UTCID07_Duplicate_Rejected_Should_Delete_Then_Update()
        {
            SetupHttpContext("dentist", 10);
            var schedule = new Schedule { ScheduleId = 1, DentistId = 5, Status = "pending" };
            var dentist = new Dentist { DentistId = 5, UserId = 10 };
            var rejected = new Schedule { ScheduleId = 9, Status = "rejected" };
            var workDate = DateTime.Today.AddDays(2);

            _scheduleRepoMock.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(schedule);
            _dentistRepoMock.Setup(r => r.GetDentistByUserIdAsync(10)).ReturnsAsync(dentist);
            _scheduleRepoMock.Setup(r => r.CheckDulplicateScheduleAsync(5, workDate, "evening", 1)).ReturnsAsync(rejected);
            _scheduleRepoMock.Setup(r => r.DeleteSchedule(9)).ReturnsAsync(true);
            _scheduleRepoMock.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var command = new EditScheduleCommand
            {
                ScheduleId = 1,
                WorkDate = workDate,
                Shift = "evening"
            };

            var result = await _handler.Handle(command, default);

            Assert.True(result);
            _scheduleRepoMock.Verify(r => r.DeleteSchedule(9), Times.Once);
            _scheduleRepoMock.Verify(r => r.UpdateScheduleAsync(It.IsAny<Schedule>()), Times.Once);
        }
    }
}
