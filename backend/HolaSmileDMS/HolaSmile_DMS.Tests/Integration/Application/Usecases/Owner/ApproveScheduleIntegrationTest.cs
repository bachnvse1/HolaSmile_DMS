using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Owner;
using HDMS_API.Infrastructure.Persistence;
using Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace HolaSmile_DMS.Tests.Integration.Application.Usecases.Owner
{
    public class ApproveScheduleHandlerTests
    {
        private readonly Mock<IScheduleRepository> _scheduleRepo = new();
        private readonly Mock<IHttpContextAccessor> _httpContextAccessor = new();
        private readonly ApproveScheduleHandle _handler;

        public ApproveScheduleHandlerTests()
        {
            _handler = new ApproveScheduleHandle(_scheduleRepo.Object, _httpContextAccessor.Object);
        }

        private void SetupContext(string role, string userId = "1")
        {
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
            var identity = new ClaimsIdentity(claims);
            var user = new ClaimsPrincipal(identity);
            _httpContextAccessor.Setup(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
        }

        [Fact(DisplayName = "UTCID01 - User is not owner → throw MSG26")]
        public async System.Threading.Tasks.Task UTCID01_NotOwner_ThrowMSG26()
        {
            SetupContext("dentist");

            var command = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG26, ex.Message);
        }

        [Fact(DisplayName = "UTCID02 - Schedule not found → throw generic error")]
        public async System.Threading.Tasks.Task UTCID02_ScheduleNotFound_ThrowError()
        {
            SetupContext("owner");

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(It.IsAny<int>())).ReturnsAsync((Schedule)null);

            var command = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal("Chỉ có thể cập nhật lịch đang ở trạng thái pending", ex.Message);
        }

        [Fact(DisplayName = "UTCID03 - Schedule not pending → throw error")]
        public async System.Threading.Tasks.Task UTCID03_StatusNotPending_ThrowError()
        {
            SetupContext("owner");

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(It.IsAny<int>())).ReturnsAsync(new Schedule { Status = "approved" });

            var command = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal("Chỉ có thể cập nhật lịch đang ở trạng thái pending", ex.Message);
        }

        [Fact(DisplayName = "UTCID04 - Update failed → throw MSG58")]
        public async System.Threading.Tasks.Task UTCID04_UpdateFailed_ThrowMSG58()
        {
            SetupContext("owner");

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(It.IsAny<int>())).ReturnsAsync(new Schedule { Status = "pending" });
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(false);

            var command = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            var ex = await Assert.ThrowsAsync<Exception>(() => _handler.Handle(command, default));
            Assert.Equal(MessageConstants.MSG.MSG58, ex.Message);
        }

        [Fact(DisplayName = "UTCID05 - Approve schedule successfully")]
        public async System.Threading.Tasks.Task UTCID05_ApproveSuccess_ReturnMSG80()
        {
            SetupContext("owner");

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(It.IsAny<int>())).ReturnsAsync(new Schedule { Status = "pending" });
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var command = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "approved" };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG80, result);
        }

        [Fact(DisplayName = "UTCID06 - Reject schedule successfully")]
        public async System.Threading.Tasks.Task UTCID06_RejectSuccess_ReturnMSG81()
        {
            SetupContext("owner");

            _scheduleRepo.Setup(r => r.GetScheduleByIdAsync(It.IsAny<int>())).ReturnsAsync(new Schedule { Status = "pending" });
            _scheduleRepo.Setup(r => r.UpdateScheduleAsync(It.IsAny<Schedule>())).ReturnsAsync(true);

            var command = new ApproveDentistScheduleCommand { ScheduleIds = new List<int> { 1 }, Action = "rejected" };

            var result = await _handler.Handle(command, default);
            Assert.Equal(MessageConstants.MSG.MSG81, result);
        }
    }
}
