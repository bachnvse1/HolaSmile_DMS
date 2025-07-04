using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Dentist.ManageSchedule;
using Application.Usecases.Dentist.ViewAllDentistSchedule;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Dentists.CreateSchedule
{
    public class CreateScheduleHandlerTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly Mock<IScheduleRepository> _scheduleRepo = new();
        private readonly Mock<IDentistRepository> _dentistRepo = new();
        private readonly CreateScheduleHandle _handler;

        public CreateScheduleHandlerTests()
        {
            _handler = new CreateScheduleHandle(_httpContextAccessor.Object, _scheduleRepo.Object, _dentistRepo.Object);
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

        [Fact(DisplayName = "UTCID01 - User not authenticated → throw MSG53")]
        public async System.Threading.Tasks.Task UTCID01_NotAuthenticated_ThrowsMSG53()
        {
            _httpContextAccessor.Setup(x => x.HttpContext).Returns((HttpContext)null);

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateScheduleCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG53, ex.Message);
        }

        [Fact(DisplayName = "UTCID02 - Role not dentist → throw MSG26")]
        public async System.Threading.Tasks.Task UTCID02_NotDentist_ThrowsMSG26()
        {
            SetupContext("patient");

            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _handler.Handle(new CreateScheduleCommand(), default));

            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Invalid schedule date → throw MSG34")]
        public async System.Threading.Tasks.Task UTCID03_InvalidDate_ThrowsMSG34()
        {
            SetupContext("dentist");
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
              {
                  new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(-1), Shift = "morning" }
              }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG34, ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Missing shift → throw MSG07")]
        public async System.Threading.Tasks.Task UTCID04_MissingShift_ThrowsMSG07()
        {
            SetupContext("dentist");
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
              {
                  new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(1), Shift = "" }
              }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG07, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Duplicate approved schedule → throw MSG89")]
        public async System.Threading.Tasks.Task UTCID05_DuplicateApproved_ThrowsMSG89()
        {
            SetupContext("dentist");
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });

            _scheduleRepo.Setup(r => r.CheckDulplicateScheduleAsync(1, It.IsAny<DateTime>(), "morning", 0))
                         .ReturnsAsync(new Schedule { Status = "approved" });

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
              {
                  new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(1), Shift = "morning" }
              }
            };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));

            Assert.Equal(MessageConstants.MSG.MSG89, ex.Message);
        }

        [Fact(DisplayName = "UTCID06 - Save failed → return MSG73")]
        public async System.Threading.Tasks.Task UTCID06_SaveFailed_ReturnMSG73()
        {
            SetupContext("dentist");
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });
            _scheduleRepo.Setup(r => r.CheckDulplicateScheduleAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>(), 0))
                         .ReturnsAsync((Schedule)null);
            _scheduleRepo.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>())).ReturnsAsync(false);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
              {
                  new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(1), Shift = "morning" }
              }
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG73, result);
        }

        [Fact(DisplayName = "UTCID07 - Create successfully → return MSG52")]
        public async System.Threading.Tasks.Task UTCID07_CreateSuccess_ReturnMSG52()
        {
            SetupContext("dentist");
            _dentistRepo.Setup(r => r.GetDentistByUserIdAsync(1)).ReturnsAsync(new global::Dentist { DentistId = 1 });
            _scheduleRepo.Setup(r => r.CheckDulplicateScheduleAsync(It.IsAny<int>(), It.IsAny<DateTime>(), It.IsAny<string>(), 0))
                         .ReturnsAsync((Schedule)null);
            _scheduleRepo.Setup(r => r.RegisterScheduleByDentist(It.IsAny<Schedule>())).ReturnsAsync(true);

            var command = new CreateScheduleCommand
            {
                RegisSchedules = new List<CreateScheduleDTO>
              {
                  new CreateScheduleDTO { WorkDate = DateTime.Now.AddDays(1), Shift = "morning" }
              }
            };

            var result = await _handler.Handle(command, default);

            Assert.Equal(MessageConstants.MSG.MSG52, result);
        }
    }
}
