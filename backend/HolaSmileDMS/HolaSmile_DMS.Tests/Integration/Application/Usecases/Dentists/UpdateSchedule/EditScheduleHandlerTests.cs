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

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.UpdateSchedule
{
    public class EditScheduleHandlerTests
    {
        private readonly Mock<IDentistRepository> _dentistRepo = new();
        private readonly Mock<IScheduleRepository> _scheduleRepo = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly EditScheduleHandle _handler;

        public EditScheduleHandlerTests()
        {
            _handler = new EditScheduleHandle(_dentistRepo.Object, _scheduleRepo.Object, _httpContextAccessor.Object);
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

        [Fact(DisplayName = "ITCID01 - No role → throw MSG53")]
        public async System.Threading.Tasks.Task ITCID01_NoRole_ThrowsMSG53()
        {
            _httpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = new ClaimsPrincipal() });

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new EditScheduleCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "ITCID02 - Schedule not found → throw MSG28")]
        public async System.Threading.Tasks.Task ITCID02_ScheduleNotFound_ThrowsMSG28()
        {
            SetupContext("dentist");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync((Schedule)null);

            var command = new EditScheduleCommand { ScheduleId = 1 };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG28, ex.Message);
        }

        [Fact(DisplayName = "ITCID03 - Not a dentist role → throw MSG26")]
        public async System.Threading.Tasks.Task ITCID03_NotDentist_ThrowsMSG26()
        {
            SetupContext("patient");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(new Schedule());

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new EditScheduleCommand { ScheduleId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID04 - Schedule not owned by dentist → throw MSG26")]
        public async System.Threading.Tasks.Task ITCID04_ScheduleNotOwned_ThrowsMSG26()
        {
            SetupContext("dentist");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(new Schedule { DentistId = 99 });
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(new EditScheduleCommand { ScheduleId = 1 }, default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "ITCID05 - Schedule approved → cannot edit")]
        public async System.Threading.Tasks.Task ITCID05_ApprovedSchedule_Throws()
        {
            SetupContext("dentist");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(new Schedule { DentistId = 1, Status = "approved" });
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new EditScheduleCommand { ScheduleId = 1 }, default));

            Assert.Equal("Lịch làm việc đã được duyệt, không thể chỉnh sửa.", ex.Message);
        }

        [Fact(DisplayName = "ITCID06 - Duplicate pending schedule → throw MSG89")]
       public async System.Threading.Tasks.Task ITCID06_DuplicatePending_ThrowsMSG89()
        {
            SetupContext("dentist");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1))
                         .ReturnsAsync(new Schedule { ScheduleId = 1, DentistId = 1, Status = "pending" }); // thêm Status = "pending"
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });
            _scheduleRepo.Setup(r => r.CheckDulplicateScheduleAsync(1, It.IsAny<DateTime>(), It.IsAny<string>(), 1))
                .ReturnsAsync(new Schedule { Status = "pending" });

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(new EditScheduleCommand { ScheduleId = 1, WorkDate = DateTime.Now, Shift = "morning" }, default));

            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }

        [Fact(DisplayName = "ITCID07 - Update failed → return false")]
        public async System.Threading.Tasks.Task ITCID07_UpdateFailed_ReturnFalse()
        {
            SetupContext("dentist");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(new Schedule { DentistId = 1, Status = "pending" });
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });
            _scheduleRepo.Setup(r => r.CheckDulplicateScheduleAsync(1, It.IsAny<DateTime>(), It.IsAny<string>(), 1)).ReturnsAsync((Schedule)null);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(false);

            var result = await _handler.Handle(new EditScheduleCommand { ScheduleId = 1, WorkDate = DateTime.Today, Shift = "morning" }, default);

            Assert.False(result);
        }

        [Fact(DisplayName = "ITCID08 - Update successful → return true")]
        public async System.Threading.Tasks.Task ITCID08_UpdateSuccess_ReturnTrue()
        {
            SetupContext("dentist");
            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(1)).ReturnsAsync(new Schedule { DentistId = 1, Status = "pending" });
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });
            _scheduleRepo.Setup(r => r.CheckDulplicateScheduleAsync(1, It.IsAny<DateTime>(), It.IsAny<string>(), 1)).ReturnsAsync((Schedule)null);
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var result = await _handler.Handle(new EditScheduleCommand { ScheduleId = 1, WorkDate = DateTime.Today, Shift = "morning" }, default);

            Assert.True(result);
        }
    }
}
